;; zyx
;; A fungible token for the 4v4 Marketplace

(define-constant ERR-UNAUTHORIZED u100)
(define-constant ERR-INSUFFICIENT_BALANCE u101)
(define-constant ERR-EMPTY-BATCH u102)
(define-constant ERR-BATCH-TOO-LARGE u103)
(define-constant ERR-INSUFFICIENT-TOTAL u104)

(define-constant TOKEN-NAME "zyx")
(define-constant TOKEN-SYMBOL "ZYX")
(define-constant DECIMALS u6)
(define-constant INITIAL_SUPPLY u7000000000000000) ;; 7B * 10^6

(define-fungible-token zyx)
(define-constant contract-owner tx-sender)

(define-data-var token-uri (optional (string-utf8 256)) none)

;; Import SIP-010 trait - updated for devnet compatibility
(impl-trait 'SP3FBR2AGBX6J8F1DJQK6A4RC24HCQQ8M04FQFW8.sip-010-trait-ft-standard.sip-010-trait)

;; Improved transfer function - properly return response from ft-transfer?
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))
    (asserts! (> amount u0) (err ERR-INSUFFICIENT_BALANCE))
    (ft-transfer? zyx amount from to)
  )
)

;; Metadata
(define-read-only (get-name) 
  (ok TOKEN-NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

(define-read-only (get-decimals)
  (ok DECIMALS)
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance zyx who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply zyx))
)

;; Token URI (optional metadata URL)
(define-public (set-token-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err ERR-UNAUTHORIZED))
    (var-set token-uri (some uri))
    (ok true)
  )
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Helper to extract amount from transfer request
(define-private (get-amount (tx { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (get amount tx)
)

;; Improved error checking for batch processing
(define-private (check-error (res (response bool uint)) (acc (response bool uint)))
  (match acc
    ok-value (match res
               ok-res res
               err-res (err err-res))
    err-value (err err-value)
  )
)

(define-private (send-token (tx { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (send-token-with-memo (get amount tx) (get to tx) (get memo tx))
)

(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (> amount u0) (err ERR-INSUFFICIENT_BALANCE))
    (transfer amount tx-sender to memo)
  )
)

;; Add burn function
(define-public (burn (amount uint) (owner principal))
  (begin
    (asserts! (is-eq owner tx-sender) (err ERR-UNAUTHORIZED))
    (ft-burn? zyx amount owner)
  )
)

;; Token Generation Event (TGE) - keep this at the end
(begin
  (try! (ft-mint? zyx INITIAL_SUPPLY contract-owner))
)

(define-constant ERR-UNAUTHORIZED u100)
(define-constant ERR-INSUFFICIENT_BALANCE u101)

(define-constant TOKEN-NAME "zyx")
(define-constant TOKEN-SYMBOL "ZYX")
(define-constant DECIMALS u6)
(define-constant INITIAL_SUPPLY u7000000000000000) ;; 7B * 10^6
(define-constant MAX-BATCH u200)

(define-fungible-token zyx)
(define-constant contract-owner tx-sender)

(define-data-var token-uri (optional (string-utf8 256)) none)

;; Import SIP-010 trait
(impl-trait 'ST000000000000000000002AMW42H.sip-010-trait-ft-standard.sip-010-trait)

;; Transfer function
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))
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
  (if (is-eq tx-sender contract-owner)
      (begin (var-set token-uri (some uri)) (ok true))
      (err ERR-UNAUTHORIZED))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Batch transfer
(define-public (send-many (batch (list MAX-BATCH { to: principal, amount: uint, memo: (optional (buff 34)) })))
  (fold check-error
    (map send-token batch)
    (ok true))
)

(define-private (check-error (res (response bool uint)) (acc (response bool uint)))
  (match acc ok-val res err-val (err err-val))
)

(define-private (send-token (tx { to: principal, amount: uint, memo: (optional (buff 34)) }))
  (send-token-with-memo (get amount tx) (get to tx) (get memo tx))
)

(define-private (send-token-with-memo (amount uint) (to principal) (memo (optional (buff 34))))
  (let ((res (try! (transfer amount tx-sender to memo))))
    (ok res))
)

;; Token Generation Event (TGE)
(begin
  (try! (ft-mint? zyx INITIAL_SUPPLY contract-owner))
)

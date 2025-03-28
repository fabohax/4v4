;; 4V4 Marketplace Contract - Enhanced Version

;; Traits
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)
(use-trait ft-trait  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; Constants
(define-constant CONTRACT_OWNER 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA)
(define-constant PAGE_SIZE u10)

;; Error Codes
(define-constant ERR_EXPIRY_IN_PAST (err u1000))
(define-constant ERR_PRICE_ZERO (err u1001))
(define-constant ERR_UNKNOWN_LISTING (err u2000))
(define-constant ERR_UNAUTHORISED (err u2001))
(define-constant ERR_LISTING_EXPIRED (err u2002))
(define-constant ERR_NFT_ASSET_MISMATCH (err u2003))
(define-constant ERR_PAYMENT_ASSET_MISMATCH (err u2004))
(define-constant ERR_MAKER_TAKER_EQUAL (err u2005))
(define-constant ERR_UNINTENDED_TAKER (err u2006))
(define-constant ERR_ASSET_CONTRACT_NOT_WHITELISTED (err u2007))
(define-constant ERR_PAYMENT_CONTRACT_NOT_WHITELISTED (err u2008))

;; Data Vars
(define-data-var listing-nonce uint u0)
(define-map listings
  uint
  {
    maker: principal,
    taker: (optional principal),
    token-id: uint,
    nft-asset-contract: principal,
    expiry: uint,
    price: uint,
    payment-asset-contract: (optional principal)
  }
)
(define-map whitelisted-asset-contracts principal bool)

;; Events
(define-event list-event (listing-id uint) (maker principal))
(define-event sale-event (listing-id uint) (buyer principal))
(define-event cancel-event (listing-id uint))

;; Read-only
(define-read-only (is-whitelisted (asset-contract principal))
  (default-to true (map-get? whitelisted-asset-contracts asset-contract))
)

(define-read-only (get-listing (listing-id uint))
  (map-get? listings listing-id)
)

(define-read-only (get-listing-price (listing-id uint))
  (ok (get price (unwrap-panic (map-get? listings listing-id))))
)

(define-read-only (get-listings (start uint))
  (map
    (lambda (i)
      (map-get? listings (+ start i))
    )
    (range u0 PAGE_SIZE)
  )
)

;; Admin
(define-public (set-whitelisted (asset-contract principal) (whitelisted bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORISED)
    (map-set whitelisted-asset-contracts asset-contract whitelisted)
    (ok true)
  )
)

;; NFT/FT Transfer Helpers
(define-private (safe-transfer-nft (contract <nft-trait>) (token-id uint) (from principal) (to principal))
  (try! (contract-call? contract transfer token-id from to))
)

(define-private (safe-transfer-ft (contract <ft-trait>) (amount uint) (from principal) (to principal))
  (try! (contract-call? contract transfer amount from to none))
)

;; Internal Royalty Call (Optional)
(define-private (pay-royalty (contract <nft-trait>) (token-id uint) (amount uint) (payer principal))
  (match (contract-call? contract get-royalty-info token-id)
    royalty
    (begin
      (let ((recipient (get recipient royalty)) (bps (get bps royalty)))
        (let ((fee (/ (* amount bps) u10000)))
          (try! (stx-transfer? fee payer recipient))
        )
      )
    )
    (ok true)
  )
)

;; Listing Creation
(define-public (list-asset
  (nft-asset-contract <nft-trait>)
  (nft-asset {
    taker: (optional principal),
    token-id: uint,
    expiry: uint,
    price: uint,
    payment-asset-contract: (optional principal)
  })
)
  (let ((listing-id (var-get listing-nonce)))
    (asserts! (is-whitelisted (contract-of nft-asset-contract)) ERR_ASSET_CONTRACT_NOT_WHITELISTED)
    (asserts! (> (get expiry nft-asset) burn-block-height) ERR_EXPIRY_IN_PAST)
    (asserts! (> (get price nft-asset) u0) ERR_PRICE_ZERO)
    (asserts! (match (get payment-asset-contract nft-asset)
      payment-asset (is-whitelisted payment-asset) true) ERR_PAYMENT_CONTRACT_NOT_WHITELISTED)

    (try! (safe-transfer-nft nft-asset-contract (get token-id nft-asset) tx-sender (as-contract tx-sender)))

    (map-set listings listing-id (merge
      { maker: tx-sender, nft-asset-contract: (contract-of nft-asset-contract) }
      nft-asset
    ))
    (var-set listing-nonce (+ listing-id u1))
    (print (list-event listing-id tx-sender))
    (ok listing-id)
  )
)

(define-public (list-assets-batch (nft-asset-contract <nft-trait>) (assets (list 50 (tuple
  taker: (optional principal),
  token-id: uint,
  expiry: uint,
  price: uint,
  payment-asset-contract: (optional principal)
))))
  (map
    (lambda (asset)
      (list-asset nft-asset-contract asset)
    )
    assets
  )
)

;; Cancel Listing
(define-public (cancel-listing (listing-id uint) (nft-asset-contract <nft-trait>))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING)))
    (asserts! (is-eq (get maker listing) tx-sender) ERR_UNAUTHORISED)
    (asserts! (is-eq (get nft-asset-contract listing) (contract-of nft-asset-contract)) ERR_NFT_ASSET_MISMATCH)
    (map-delete listings listing-id)
    (as-contract (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) tx-sender))
    (print (cancel-event listing-id))
    (ok true)
  )
)

;; Internal Validation
(define-private (assert-can-fulfil
  (nft-asset-contract principal)
  (payment-asset-contract (optional principal))
  (listing (tuple
    maker: principal,
    taker: (optional principal),
    token-id: uint,
    nft-asset-contract: principal,
    expiry: uint,
    price: uint,
    payment-asset-contract: (optional principal)
  ))
)
  (begin
    (asserts! (not (is-eq (get maker listing) tx-sender)) ERR_MAKER_TAKER_EQUAL)
    (asserts! (match (get taker listing) intended (is-eq intended tx-sender) true) ERR_UNINTENDED_TAKER)
    (asserts! (< burn-block-height (get expiry listing)) ERR_LISTING_EXPIRED)
    (asserts! (is-eq (get nft-asset-contract listing) nft-asset-contract) ERR_NFT_ASSET_MISMATCH)
    (asserts! (is-eq (get payment-asset-contract listing) payment-asset-contract) ERR_PAYMENT_ASSET_MISMATCH)
    (ok true)
  )
)

;; Fulfil (STX)
(define-public (fulfil-listing-stx (listing-id uint) (nft-asset-contract <nft-trait>))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING)))
    (try! (assert-can-fulfil (contract-of nft-asset-contract) none listing))
    (try! (pay-royalty nft-asset-contract (get token-id listing) (get price listing) tx-sender))
    (try! (as-contract (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) tx-sender)))
    (try! (stx-transfer? (get price listing) tx-sender (get maker listing)))
    (map-delete listings listing-id)
    (print (sale-event listing-id tx-sender))
    (ok listing-id)
  )
)

;; Fulfil (FT)
(define-public (fulfil-listing-ft (listing-id uint) (nft-asset-contract <nft-trait>) (payment-asset-contract <ft-trait>))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING)))
    (try! (assert-can-fulfil (contract-of nft-asset-contract) (some (contract-of payment-asset-contract)) listing))
    (try! (as-contract (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) tx-sender)))
    (try! (safe-transfer-ft payment-asset-contract (get price listing) tx-sender (get maker listing)))
    (map-delete listings listing-id)
    (print (sale-event listing-id tx-sender))
    (ok listing-id)
  )
)

;; Fulfil (sBTC placeholder - requires wrapping logic in future)
;; TODO: Add proper sBTC support

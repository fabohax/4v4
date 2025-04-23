;; 4V4 Marketplace Contract

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
(define-constant ERR_BATCH_LISTING_FAILED (err u3000)) 

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

;; New Function: Retrieve all whitelisted contracts
(define-read-only (get-whitelisted-contracts)
  (map
    (lambda (contract)
      { contract: contract, whitelisted: (unwrap-panic (map-get? whitelisted-asset-contracts contract)) }
    )
    (keys whitelisted-asset-contracts)
  )
)

;; New Function: Retrieve all listings
(define-read-only (get-all-listings)
  (map
    (lambda (id)
      (map-get? listings id)
    )
    (range u0 (var-get listing-nonce))
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

;; NFT Transfer Helper
(define-private (safe-transfer-nft (contract principal) (token-id uint) (from principal) (to principal))
  (match (contract-call? contract transfer token-id from to)
    result (ok result)
    (err u5001))
)

;; FT Transfer Helper
(define-private (safe-transfer-ft (contract principal) (amount uint) (from principal) (to principal))
  (match (contract-call? contract transfer amount from to none)
    result (ok result)
    (err u5002))
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
  (nft-asset-contract principal)
  (nft-asset {
    taker: (optional principal),
    token-id: uint,
    expiry: uint,
    price: uint,
    payment-asset-contract: (optional principal)
  })
)
  (let ((listing-id (var-get listing-nonce)))
    (asserts! (is-whitelisted nft-asset-contract) ERR_ASSET_CONTRACT_NOT_WHITELISTED)
    (asserts! (> (get expiry nft-asset) block-height) ERR_EXPIRY_IN_PAST)
    (asserts! (> (get price nft-asset) u0) ERR_PRICE_ZERO)
    (asserts! (match (get payment-asset-contract nft-asset)
      payment-asset (is-whitelisted payment-asset)
      true) ERR_PAYMENT_CONTRACT_NOT_WHITELISTED)

    (try! (safe-transfer-nft nft-asset-contract (get token-id nft-asset) tx-sender (as-contract tx-sender)))

    (map-set listings listing-id (merge
      { maker: tx-sender, nft-asset-contract: nft-asset-contract }
      nft-asset
    ))
    (var-set listing-nonce (+ listing-id u1))
    ;; Log listing creation
    (print { action: "list-asset", listing-id: listing-id, maker: tx-sender })
    (ok listing-id)
  )
)

;; Batch Listing with Error Handling
(define-public (list-assets-batch (nft-asset-contract <nft-trait>) (assets (list 50 (tuple
  taker: (optional principal),
  token-id: uint,
  expiry: uint,
  price: uint,
  payment-asset-contract: (optional principal)
))))
  (let ((results
    (map
      (lambda (asset)
        (try! (list-asset nft-asset-contract asset))
      )
      assets
    )
  ))
    (if (is-eq (len results) (len assets))
      (ok results)
      (err ERR_BATCH_LISTING_FAILED)
    )
  )
)

;; Cancel Listing
(define-public (cancel-listing (listing-id uint) (nft-asset-contract principal))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING)))
    (asserts! (is-eq (get maker listing) tx-sender) ERR_UNAUTHORISED)
    (asserts! (is-eq (get nft-asset-contract listing) nft-asset-contract) ERR_NFT_ASSET_MISMATCH)
    (map-delete listings listing-id)
    (try! (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) tx-sender))
    ;; Log listing cancellation
    (print { action: "cancel-listing", listing-id: listing-id, maker: tx-sender })
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
    (asserts! (< block-height (get expiry listing)) ERR_LISTING_EXPIRED)
    (asserts! (is-eq (get nft-asset-contract listing) nft-asset-contract) ERR_NFT_ASSET_MISMATCH)
    (asserts! (is-eq (get payment-asset-contract listing) payment-asset-contract) ERR_PAYMENT_ASSET_MISMATCH)
    (ok true)
  )
)

;; Fulfil (STX)
(define-public (fulfil-listing-stx (listing-id uint) (nft-asset-contract principal))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING)))
    (try! (assert-can-fulfil nft-asset-contract none listing))
    (try! (pay-royalty nft-asset-contract (get token-id listing) (get price listing) tx-sender))
    (try! (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) tx-sender))
    (try! (stx-transfer? (get price listing) tx-sender (get maker listing)))
    (map-delete listings listing-id)
    ;; Log sale completion
    (print { action: "fulfil-listing-stx", listing-id: listing-id, buyer: tx-sender })
    (ok listing-id)
  )
)

;; Fulfil (FT)
(define-public (fulfil-listing-ft (listing-id uint) (nft-asset-contract principal) (payment-asset-contract principal))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING)))
    (try! (assert-can-fulfil nft-asset-contract (some payment-asset-contract) listing))
    (try! (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) tx-sender))
    (try! (safe-transfer-ft payment-asset-contract (get price listing) tx-sender (get maker listing)))
    (map-delete listings listing-id)
    ;; Log sale completion
    (print { action: "fulfil-listing-ft", listing-id: listing-id, buyer: tx-sender })
    (ok listing-id)
  )
)
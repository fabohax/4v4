;; 4V4 Marketplace Contract v1.0

;; Traits
(define-trait nft-trait
  (
    ;; Last token ID, limited to uint range
    (get-last-token-id () (response uint uint))

    ;; URI for metadata associated with the token
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))

     ;; Owner of a given token identifier
    (get-owner (uint) (response (optional principal) uint))

    ;; Transfer from the sender to a new principal
    (transfer (uint principal principal) (response bool uint))
  )
)

(define-trait ft-trait
  (
    ;; Transfer from the caller to a new principal
    (transfer-ft (uint principal principal (optional (buff 34))) (response bool uint))

    ;; the human readable name of the token
    (get-name () (response (string-ascii 32) uint))

    ;; the ticker symbol, or empty if none
    (get-symbol () (response (string-ascii 32) uint))

    ;; the number of decimals used, e.g. 6 would mean 1_000_000 represents 1 token
    (get-decimals () (response uint uint))

    ;; the balance of the passed principal
    (get-balance (principal) (response uint uint))

    ;; the current total supply (which does not need to be a constant)
    (get-total-supply () (response uint uint))

    ;; an optional URI that represents metadata of this token
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)

;; Constants
(define-constant CONTRACT_OWNER 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS)

;; Errors
(define-constant ERR_EXPIRY_IN_PAST (err u1000))
(define-constant ERR_PRICE_ZERO (err u1001))
(define-constant ERR_UNKNOWN_LISTING (err u2000))
(define-constant ERR_UNAUTHORIZED (err u2001))
(define-constant ERR_LISTING_EXPIRED (err u2002))
(define-constant ERR_NFT_TRANSFER_FAILED (err u5001))
(define-constant ERR_PAYMENT_CONTRACT_NOT_WHITELISTED (err u5002))
(define-constant ERR_NFT_ASSET_MISMATCH (err u5003)) ;; Added error constant
(define-constant ERR_MAKER_TAKER_EQUAL (err u5004))
(define-constant ERR_UNINTENDED_TAKER (err u5005))
(define-constant ERR_PAYMENT_ASSET_MISMATCH (err u5006))

;; Data Vars
(define-data-var listing-nonce uint u0)
(define-map listings
  uint
  {
    maker: principal,
    token-id: uint,
    nft-asset-contract: principal,
    expiry: uint,
    price: uint,
    taker: (optional principal),
    payment-asset-contract: (optional principal)
  }
)

;; NFT Transfer Helper
(define-private (safe-transfer-nft (contract <nft-trait>) (token-id uint) (from principal) (to principal))
  (match (contract-call? contract transfer token-id from to)
    result (ok result)
    error ERR_NFT_TRANSFER_FAILED) 
)

;; Listing Creation
(define-public (list-asset
  (nft-asset-contract <nft-trait>)
  (nft-asset {
    token-id: uint,
    expiry: uint,
    price: uint,
    payment-asset-contract: (optional principal)
  })
  (current-block-height uint)
)
  (let ((listing-id (var-get listing-nonce)))
    ;; Validate expiry and price
    (asserts! (> (get expiry nft-asset) current-block-height) ERR_EXPIRY_IN_PAST)
    (asserts! (> (get price nft-asset) u0) ERR_PRICE_ZERO)

    ;; Transfer NFT to the marketplace contract
    (let ((token-id (get token-id nft-asset)))
      (try! (safe-transfer-nft nft-asset-contract token-id tx-sender (as-contract tx-sender)))
    )

    ;; Store the listing
    (map-set listings listing-id {
      maker: (unwrap! (some tx-sender) ERR_UNAUTHORIZED),
      token-id: (get token-id nft-asset),
      nft-asset-contract: (contract-of nft-asset-contract),
      price: (get price nft-asset),
      taker: none,
      payment-asset-contract: (get payment-asset-contract nft-asset),
      expiry: (get expiry nft-asset)
    })

    ;; Increment the listing nonce
    (var-set listing-nonce (+ listing-id u1))
    (ok listing-id)
  )
)

;; Cancel Listing
(define-public (cancel-listing (listing-id uint) (nft-asset-contract <nft-trait>))
  (let (
      (listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING))
      (maker (get maker listing))
    )
    (asserts! (is-eq maker tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get nft-asset-contract listing) (contract-of nft-asset-contract)) ERR_NFT_ASSET_MISMATCH)
    (map-delete listings listing-id)
    (try! (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) maker))
    (ok true)
  )
)

;; Assert Can Fulfil
(define-private (assert-can-fulfil (nft-asset-contract principal) (payment-asset-contract (optional principal)) (listing {
  maker: principal,
  taker: (optional principal),
  token-id: uint,
  nft-asset-contract: principal,
  expiry: uint,
  price: uint,
  payment-asset-contract: (optional principal)
}))
  (begin
    (asserts! (not (is-eq (get maker listing) tx-sender)) ERR_MAKER_TAKER_EQUAL)
    (asserts! (match (get taker listing) intended-taker (is-eq intended-taker tx-sender) true) ERR_UNINTENDED_TAKER)
    (asserts! (< stacks-block-height (get expiry listing)) ERR_LISTING_EXPIRED)
    (asserts! (is-eq (get nft-asset-contract listing) nft-asset-contract) ERR_NFT_ASSET_MISMATCH)
    (asserts! (is-eq (get payment-asset-contract listing) payment-asset-contract) ERR_PAYMENT_ASSET_MISMATCH)
    (ok true)
  )
)

;; Fulfil Listing with STX
(define-public (fulfil-listing-stx (listing-id uint) (nft-asset-contract <nft-trait>))
  (let (
      (listing (unwrap! (map-get? listings listing-id) ERR_UNKNOWN_LISTING))
      (taker tx-sender)
      (current-block-height stacks-block-height)
    )
    (try! (assert-can-fulfil (unwrap! (contract-of nft-asset-contract nft-trait)) (get payment-asset-contract listing) listing))
    (try! (safe-transfer-nft nft-asset-contract (get token-id listing) (as-contract tx-sender) taker))
    (try! (stx-transfer? (get price listing) taker (get maker listing)))
    (map-delete listings listing-id)
    (ok listing-id)
  )
)
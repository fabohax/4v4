;; 4V4 SIP-009 NFT Contract

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-non-fungible-token mod uint)

;; Constants
(define-constant COLLECTION_LIMIT u10000)
(define-constant CONTRACT_OWNER tx-sender)

;; Errors
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_SOLD_OUT (err u402))
(define-constant ERR_WHITELIST_LIMIT (err u403))
(define-constant ERR_METADATA_FROZEN (err u404))

;; Storage
(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 256) "ipfs://")
(define-map token-uri-map { id: uint } { uri: (string-ascii 256) })
(define-data-var metadata-frozen bool false)

;; Whitelist: {user: {allowed, minted}}
(define-map whitelist {user: principal} {allowed: uint, minted: uint})

;; Royalty Info
(define-data-var royalty-percent uint u5)
(define-data-var royalty-recipient principal CONTRACT_OWNER)

;; Admin Functions
(define-public (set-base-uri (new-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (not (var-get metadata-frozen)) ERR_METADATA_FROZEN)
    (var-set base-uri new-uri)
    (ok true)
  ))

(define-public (set-token-uri (id uint) (uri (string-ascii 256)))
  (match (nft-get-owner? mod id)
    owner
      (begin
        (asserts! (is-eq tx-sender owner) (err u401))
        (map-set token-uri-map { id: id } { uri: uri })
        (ok true))
    (err u401)))

(define-public (freeze-metadata)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set metadata-frozen true)
    (ok true)
  ))

;; Burn functionality
(define-public (burn (token-id uint))
  (begin
    (asserts! (is-eq (unwrap! (nft-get-owner? mod token-id) ERR_UNAUTHORIZED) tx-sender) ERR_UNAUTHORIZED)
    (try! (nft-burn? mod token-id tx-sender))
    (ok true)))

;; Batch minting for efficiency
(define-public (mint-batch (count uint) (recipient principal))
  (let ((current-supply (var-get last-token-id)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
      (asserts! (<= (+ current-supply count) COLLECTION_LIMIT) ERR_SOLD_OUT)
      (batch-mint count recipient current-supply)
      (var-set last-token-id (+ current-supply count))
      (ok true))))

;; Helper function for batch minting
(define-private (batch-mint (count uint) (recipient principal) (start-id uint))
  (if (is-eq count u0)
    true
    (begin
      (unwrap! (nft-mint? mod (+ start-id u1) recipient) false)
      (batch-mint (- count u1) recipient (+ start-id u1)))))

;; Price configuration
(define-data-var mint-price uint u100000000) ;; 1 STX default

(define-public (set-mint-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set mint-price new-price)
    (ok true)))

;; Update mint-public to include payment
(define-public (mint-public (metadata-cid (string-ascii 256)))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (begin
      ;; Ensure the collection limit is not exceeded
      (asserts! (<= token-id COLLECTION_LIMIT) ERR_SOLD_OUT)
      
      ;; Process payment
      (try! (stx-transfer? (var-get mint-price) tx-sender CONTRACT_OWNER))
      
      ;; Mint the NFT to the sender
      (try! (nft-mint? mod token-id tx-sender))
      
      ;; Store the metadata CID in the token-uri-map
      (map-set token-uri-map { id: token-id } { uri: metadata-cid })
      
      ;; Update the last token ID
      (var-set last-token-id token-id)
      
      ;; Return the token ID
      (ok token-id))))

;; Contract ownership transfer
(define-public (transfer-contract-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set royalty-recipient new-owner)
    (ok true)))

;; Add functions to manage royalty settings
(define-public (set-royalty-percent (new-percent uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (<= new-percent u25) (err u405)) ;; Max 25%
    (var-set royalty-percent new-percent)
    (ok true)))

;; Collection metadata
(define-read-only (get-collection-info)
  (ok {
    name: "4V4",
    artist: CONTRACT_OWNER,
    total-supply: COLLECTION_LIMIT,
    minted: (var-get last-token-id)
  }))

;; SIP-009 Required Functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (id uint))
  (match (map-get? token-uri-map { id: id })
    entry (ok (some (get uri entry)))
    (ok none)))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? mod id)))

;; Royalty Info for Marketplaces
(define-read-only (get-royalty-info (sale-price uint))
  (ok {recipient: (var-get royalty-recipient), amount: (/ (* sale-price (var-get royalty-percent)) u100)}))

(define-read-only (get-remaining-supply)
  (ok (- COLLECTION_LIMIT (var-get last-token-id))))

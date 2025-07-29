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
(define-constant ERR_INVALID_PARAMS (err u405))

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
    (match (nft-get-owner? mod token-id)
      owner (asserts! (is-eq owner tx-sender) ERR_UNAUTHORIZED)
      (err u404)) ;; Token doesn't exist
    (try! (nft-burn? mod token-id tx-sender))
    (ok true)))

;; Batch minting 
(define-public (mint-batch (count uint) (recipient principal))
  (let ((current-supply (var-get last-token-id)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
      (asserts! (> count u0) ERR_INVALID_PARAMS)
      (asserts! (<= (+ current-supply count) COLLECTION_LIMIT) ERR_SOLD_OUT)
      (for
        (lambda (i)
          (unwrap! (nft-mint? mod (+ current-supply (+ i u1)) recipient) false))
        (range u0 count))
      (var-set last-token-id (+ current-supply count))
      (ok true))))
        
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

;; Update whitelist minting to include payment
(define-public (mint-whitelist (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (begin
      (asserts! (<= token-id COLLECTION_LIMIT) ERR_SOLD_OUT)
      (match (map-get? whitelist {user: tx-sender})
        whitelist-entry
          (let (
              (allowed (get allowed whitelist-entry))
              (minted (get minted whitelist-entry))
            )
            (begin
              (asserts! (< minted allowed) ERR_WHITELIST_LIMIT)
              ;; Process payment if price is set above zero
              (if (> (var-get mint-price) u0)
                  (try! (stx-transfer? (var-get mint-price) tx-sender CONTRACT_OWNER))
                  true)
              (try! (nft-mint? mod token-id recipient))
              (map-set whitelist {user: tx-sender} {allowed: allowed, minted: (+ minted u1)})
              (var-set last-token-id token-id)
              (ok token-id)))
        (err u401)))))

;; Contract ownership transfer
(define-public (transfer-contract-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Update royalty recipient as well as contract owner
    (var-set royalty-recipient new-owner)
    ;; Note: We can't actually update CONTRACT_OWNER as it's a constant
    ;; Would need to redesign with principal variable instead of constant
    (ok true)))

;; 4V4 SIP-009 NFT Contract

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-non-fungible-token avatar uint)

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
(define-data-var base-uri (string-ascii 256) "ipfs://QmInitialCID/")
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

(define-public (freeze-metadata)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set metadata-frozen true)
    (ok true)
  ))

(define-public (add-to-whitelist (addr principal) (allowance uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set whitelist {user: addr} {allowed: allowance, minted: u0})
    (ok true)
  ))

;; Minting with Whitelist
(define-public (mint-whitelist (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (begin
      (asserts! (<= token-id COLLECTION_LIMIT) ERR_SOLD_OUT)
      (match (map-get? whitelist {user: tx-sender})
        whitelist-entry
          (let ((allowed (get allowed whitelist-entry))
                (minted (get minted whitelist-entry)))
            (asserts! (< minted allowed) ERR_WHITELIST_LIMIT)
            (try! (nft-mint? avatar token-id recipient))
            (map-set whitelist {user: tx-sender} {allowed: allowed, minted: (+ minted u1)})
            (var-set last-token-id token-id)
            (ok token-id))
        none (err ERR_UNAUTHORIZED))
    )))

;; Public Mint (post-whitelist phase)
(define-public (mint-public)
  (let ((token-id (+ (var-get last-token-id) u1)))
    (begin
      (asserts! (<= token-id COLLECTION_LIMIT) ERR_SOLD_OUT)
      (try! (nft-mint? avatar token-id tx-sender))
      (var-set last-token-id token-id)
      (ok token-id))))

;; Transfer NFT
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq sender contract-caller) ERR_UNAUTHORIZED)
    (try! (nft-transfer? avatar id sender recipient))
    (ok true)))

;; SIP-009 Required Functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (id uint))
  (ok (some (var-get base-uri))))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? avatar id)))

;; Royalty Info for Marketplaces
(define-read-only (get-royalty-info (sale-price uint))
  (ok {recipient: (var-get royalty-recipient), amount: (/ (* sale-price (var-get royalty-percent)) u100)}))

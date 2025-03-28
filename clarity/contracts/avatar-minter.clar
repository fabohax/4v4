;; SIP-009 NFT Trait Implementation
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; NFT Collection
(define-non-fungible-token avatar uint)

;; Constants
(define-constant COLLECTION_LIMIT u10000000)
(define-constant CONTRACT_OWNER 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA) ;; Set to deployer's address

;; Error Codes
(define-constant ERR_OWNER_ONLY (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))
(define-constant ERR_SOLD_OUT (err u300))

;; Storage
(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 80) "https://placedog.net/500/500?id={id}")

;; SIP-009: Get last token ID
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

;; SIP-009: Get token URI (dynamically replaces `{id}`)
(define-read-only (get-token-uri (token-id uint))
  (ok (some (replace (var-get base-uri) "{id}" (to-utf8 token-id))))
)

;; SIP-009: Get token owner
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? avatar token-id))
)

;; SIP-009: Transfer NFT
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_NOT_TOKEN_OWNER)
    (nft-transfer? avatar token-id sender recipient)
  )
)

;; Admin: Set base URI
(define-public (set-base-uri (new-uri (string-ascii 80)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_OWNER_ONLY)
    (var-set base-uri new-uri)
    (ok true)
  )
)

;; Mint function (owner-only mint)
(define-public (mint (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (begin
      (asserts! (< token-id COLLECTION_LIMIT) ERR_SOLD_OUT)
      (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_OWNER_ONLY)

      (try! (nft-mint? avatar token-id recipient))
      (var-set last-token-id token-id)
      (ok token-id)
    )
  )
)

;; Optional: Public mint function (for self-minting)
(define-public (mint-next)
  (mint tx-sender)
)

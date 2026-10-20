;; Shared marketplace for 3D model assets.
;; Model binaries and JSON metadata stay on IPFS; this contract stores only CIDs,
;; seller, asking price, and whether the listing is active.

(define-constant ERR-NOT-FOUND (err u100))
(define-constant ERR-NOT-SELLER (err u101))
(define-constant ERR-INVALID-PRICE (err u102))
(define-constant ERR-SELF-PURCHASE (err u103))
(define-constant ERR-INACTIVE (err u104))
(define-constant ERR-TRANSFER (err u105))

(define-data-var next-listing-id uint u1)

(define-map listings
  { listing-id: uint }
  {
    seller: principal,
    model-cid: (string-ascii 100),
    metadata-cid: (string-ascii 100),
    price: uint,
    active: bool
  }
)

(define-public (list-model
  (model-cid (string-ascii 100))
  (metadata-cid (string-ascii 100))
  (price uint)
)
  (let ((listing-id (var-get next-listing-id)))
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (map-set listings
      { listing-id: listing-id }
      {
        seller: tx-sender,
        model-cid: model-cid,
        metadata-cid: metadata-cid,
        price: price,
        active: true
      }
    )
    (var-set next-listing-id (+ listing-id u1))
    (ok listing-id)
  )
)

(define-public (update-price (listing-id uint) (price uint))
  (let ((listing (unwrap! (map-get? listings { listing-id: listing-id }) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-SELLER)
    (asserts! (get active listing) ERR-INACTIVE)
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (map-set listings
      { listing-id: listing-id }
      (merge listing { price: price })
    )
    (ok true)
  )
)

(define-public (delist-model (listing-id uint))
  (let ((listing (unwrap! (map-get? listings { listing-id: listing-id }) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-SELLER)
    (asserts! (get active listing) ERR-INACTIVE)
    (map-set listings
      { listing-id: listing-id }
      (merge listing { active: false })
    )
    (ok true)
  )
)

(define-public (buy-model (listing-id uint))
  (let ((listing (unwrap! (map-get? listings { listing-id: listing-id }) ERR-NOT-FOUND)))
    (asserts! (get active listing) ERR-INACTIVE)
    (asserts! (not (is-eq tx-sender (get seller listing))) ERR-SELF-PURCHASE)
    (try! (stx-transfer? (get price listing) tx-sender (get seller listing)))
    (map-set listings
      { listing-id: listing-id }
      (merge listing { seller: tx-sender, active: false })
    )
    (ok true)
  )
)

(define-read-only (get-listing (listing-id uint))
  (map-get? listings { listing-id: listing-id })
)

(define-read-only (get-next-listing-id)
  (ok (var-get next-listing-id))
)

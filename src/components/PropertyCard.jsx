import '../styles/PropertyCard.css'

export default function PropertyCard({ property, showPrice, children }) {
  if (!property) return null

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getLocation = () => {
    const parts = []
    if (property.city) parts.push(property.city)
    if (property.state) parts.push(property.state)
    if (property.province) parts.push(property.province)
    return parts.join(', ')
  }

  return (
    <div className="property-card">
      <div className="property-image">
        <img
          src={property.image_url || '/placeholder.jpg'}
          alt={property.address}
          onError={(e) => {
            e.target.src = '/placeholder.jpg'
          }}
        />
      </div>

      <div className="property-details">
        <div className="property-address">
          <div className="address-line">{property.address}</div>
          <div className="location">{getLocation()}</div>
        </div>

        <div className="property-price">
          {showPrice ? (
            <span className="price">{formatPrice(property.price)}</span>
          ) : (
            <span className="price-hidden">???</span>
          )}
        </div>

        <div className="property-specs">
          {property.bedrooms && (
            <div className="spec">
              <span className="spec-icon bed-icon"></span>
              <span className="spec-value">{property.bedrooms} beds</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="spec">
              <span className="spec-icon bath-icon"></span>
              <span className="spec-value">{property.bathrooms} baths</span>
            </div>
          )}
          {property.sqft && (
            <div className="spec">
              <span className="spec-icon sqft-icon"></span>
              <span className="spec-value">{property.sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {property.property_type && (
          <div className="property-type">
            <span>{property.property_type}</span>
          </div>
        )}

        {children && (
          <div className="property-actions">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

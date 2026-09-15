import type { Bike } from '../types'

export function BikeCard({ bike }: { bike: Bike }) {
  return (
    <div className="card">
      <h3>
        {bike.make} {bike.model} ({bike.year})
      </h3>
      <p>{bike.currentMileage} km</p>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Box, Button, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslate } from '../../hooks/useTranslate'

// Fix default marker icon paths for Leaflet with bundlers
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

interface LocationMapProps {
  latitude?: number
  longitude?: number
  address?: string
  bounds?: [[number, number], [number, number]]
  height?: number
  onLocationChange?: (loc: { latitude: number; longitude: number; address?: string; text?: string }) => void
  // New: allow hiding the "Use my location" control for doctor views
  showUseMyLocation?: boolean
}

const MapController: React.FC<{ latitude?: number; longitude?: number; bounds?: [[number, number],[number, number]] }> = ({ latitude, longitude, bounds }) => {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    if (bounds) {
      try {
        map.fitBounds(bounds, { padding: [16, 16] })
      } catch {}
    } else if (typeof latitude === 'number' && typeof longitude === 'number') {
      map.setView([latitude, longitude], 16)
    }
  }, [map, latitude, longitude, bounds])
  return null
}

const GeolocationController: React.FC<{ userPos: { lat: number; lon: number } | null }> = ({ userPos }) => {
  const map = useMap()
  useEffect(() => {
    if (!map || !userPos) return
    map.setView([userPos.lat, userPos.lon], 16)
  }, [map, userPos])
  return null
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude, address, bounds, height = 240, onLocationChange, showUseMyLocation = true }) => {
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null)
  const [geoError, setGeoError] = useState<string>('')
  const { t } = useTranslate()
  const theme = useTheme()

  const handleUseMyLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      setUserPos({ lat, lon })
      // Map view will be set by GeolocationController
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
        const data = await res.json()
        const display = data?.display_name as string | undefined
        onLocationChange?.({ latitude: lat, longitude: lon, address: display, text: display })
      } catch (e: any) {
        // Even if reverse geocoding fails, still pass coordinates
        onLocationChange?.({ latitude: lat, longitude: lon })
      }
    }, (err) => {
      setGeoError(err?.message || 'Failed to get device location.')
    }, { enableHighAccuracy: true, timeout: 10000 })
  }

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number'

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: showUseMyLocation ? 'space-between' : 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ flex: '1 1 auto', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {address || (hasCoords ? `Lat: ${latitude!.toFixed(4)}, Lng: ${longitude!.toFixed(4)}` : t('No location selected'))}
        </Typography>
        {showUseMyLocation && (
          <Button variant="outlined" size="small" onClick={handleUseMyLocation}>{t('Use my location')}</Button>
        )}
      </Box>
      {geoError && (
        <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>{t(geoError)}</Typography>
      )}
      <div
        style={{
          height,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.92 : 1)
        }}
      >
        <MapContainer
          center={hasCoords ? [latitude!, longitude!] : [0, 0]}
          zoom={hasCoords ? 13 : 2}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController latitude={latitude} longitude={longitude} bounds={bounds} />
          <GeolocationController userPos={userPos} />
          {hasCoords && (
            <Marker position={[latitude!, longitude!]}>
              <Popup>
                {address || `Lat: ${latitude!.toFixed(4)}, Lng: ${longitude!.toFixed(4)}`}
              </Popup>
            </Marker>
          )}
          {userPos && (
            <CircleMarker
              center={[userPos.lat, userPos.lon]}
              radius={10}
              pathOptions={{
                color: theme.palette.primary.dark,
                fillColor: theme.palette.primary.main,
                fillOpacity: theme.palette.mode === 'dark' ? 0.55 : 0.4
              }}
            >
              <Popup>{t('My location')}</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
    </Box>
  )
}

export default LocationMap

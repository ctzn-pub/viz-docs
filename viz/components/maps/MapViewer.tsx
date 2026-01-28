"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { PMTiles, Protocol } from "pmtiles"

import { datasets, datasetList, getDatasetRegions, type DatasetConfig } from "./config/datasets"
import { type MetricConfig, formatMetricValue } from "./config/metrics"
import { regions, type RegionConfig } from "./config/regions"
import { Legend, CHOROPLETH_COLORS } from "./Legend"
import { MetricSelector } from "./MetricSelector"
import { RegionSelector } from "./RegionSelector"
import { DatasetSelector } from "./DatasetSelector"
import { calculateBreaks, extractMetricValues } from "./hooks/useQuantileBreaks"

interface MapViewerProps {
  initialDataset?: string
}

export function MapViewer({ initialDataset = "health" }: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const protocolRef = useRef<Protocol | null>(null)

  const [selectedDataset, setSelectedDataset] = useState(initialDataset)
  const [selectedMetric, setSelectedMetric] = useState(datasets[initialDataset]?.defaultMetric ?? "")
  const [selectedRegion, setSelectedRegion] = useState(datasets[initialDataset]?.defaultRegion ?? "nyc")
  const [isLoading, setIsLoading] = useState(true)
  const [legendData, setLegendData] = useState<{
    breaks: number[] | null
    min: number | null
    max: number | null
  }>({ breaks: null, min: null, max: null })

  const currentDataset = datasets[selectedDataset]
  const currentMetric = currentDataset?.metrics[selectedMetric]
  const currentRegion = regions[selectedRegion]
  const availableRegions = getDatasetRegions(selectedDataset)

  // Setup tooltip handlers
  const setupTooltipHandlers = useCallback((map: maplibregl.Map, popup: maplibregl.Popup, metric: MetricConfig) => {
    // Use type assertion for layer-specific event handlers
    const mapAny = map as unknown as {
      off: (type: string, layer: string, listener?: unknown) => void
      on: (type: string, layer: string, listener: (e: maplibregl.MapLayerMouseEvent) => void) => void
    }

    // Remove existing handlers
    mapAny.off("mousemove", "choropleth-layer")
    mapAny.off("mouseleave", "choropleth-layer")

    mapAny.on("mousemove", "choropleth-layer", (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return

      map.getCanvas().style.cursor = "pointer"

      const properties = e.features[0].properties
      const zipCode = properties?.zip_code
      const value = properties?.[metric.id]

      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="popup-content">
            <p class="popup-title">Zip Code: ${zipCode ?? "Unknown"}</p>
            <p class="popup-value">${metric.title}: ${formatMetricValue(value as number, metric.format)}</p>
          </div>
        `)
        .addTo(map)
    })

    mapAny.on("mouseleave", "choropleth-layer", () => {
      map.getCanvas().style.cursor = ""
      popup.remove()
    })
  }, [])

  // Setup data layer with choropleth styling
  const setupDataLayer = useCallback((
    map: maplibregl.Map,
    popup: maplibregl.Popup,
    dataset: DatasetConfig,
    metric: MetricConfig
  ): void => {
    // Wait for source to be loaded
    if (!map.getSource("pmtiles-source")) {
      setTimeout(() => setupDataLayer(map, popup, dataset, metric), 100)
      return
    }

    // Remove existing layers
    if (map.getLayer("choropleth-layer")) map.removeLayer("choropleth-layer")
    if (map.getLayer("outline-layer")) map.removeLayer("outline-layer")
    if (map.getLayer("temp-layer")) map.removeLayer("temp-layer")

    // Add temporary layer to trigger data loading
    map.addLayer({
      id: "temp-layer",
      source: "pmtiles-source",
      "source-layer": dataset.sourceLayer,
      type: "fill",
      paint: { "fill-opacity": 0 },
    })

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      console.warn("Data loading timeout reached")
      setIsLoading(false)
    }, 5000)

    map.once("idle", () => {
      clearTimeout(timeoutId)

      try {
        const features = map.querySourceFeatures("pmtiles-source", {
          sourceLayer: dataset.sourceLayer,
        })

        const values = extractMetricValues(features, metric.id)
        const breakData = calculateBreaks(values)

        if (!breakData) {
          // No data
          if (map.getLayer("temp-layer")) map.removeLayer("temp-layer")

          map.addLayer({
            id: "choropleth-layer",
            source: "pmtiles-source",
            "source-layer": dataset.sourceLayer,
            type: "fill",
            paint: {
              "fill-color": "#cccccc",
              "fill-opacity": 0.5,
            },
          })

          setLegendData({ breaks: null, min: null, max: null })
          setupTooltipHandlers(map, popup, metric)
          setIsLoading(false)
          return
        }

        const { breaks, min, max } = breakData

        if (map.getLayer("temp-layer")) map.removeLayer("temp-layer")

        // Build paint expression based on breaks
        let fillColorExpression: string | maplibregl.ExpressionSpecification

        if (breaks.length === 0) {
          // Single value - use middle color
          fillColorExpression = CHOROPLETH_COLORS[2]
        } else {
          fillColorExpression = [
            "step",
            ["to-number", ["get", metric.id]],
            CHOROPLETH_COLORS[0],
            breaks[0],
            CHOROPLETH_COLORS[1],
            breaks[1],
            CHOROPLETH_COLORS[2],
            breaks[2],
            CHOROPLETH_COLORS[3],
            breaks[3],
            CHOROPLETH_COLORS[4],
          ] as maplibregl.ExpressionSpecification
        }

        map.addLayer({
          id: "choropleth-layer",
          source: "pmtiles-source",
          "source-layer": dataset.sourceLayer,
          type: "fill",
          paint: {
            "fill-color": fillColorExpression,
            "fill-opacity": 0.7,
          },
        })

        map.addLayer({
          id: "outline-layer",
          source: "pmtiles-source",
          "source-layer": dataset.sourceLayer,
          type: "line",
          paint: {
            "line-color": "#ffffff",
            "line-width": 0.5,
            "line-opacity": 0.5,
          },
        })

        setLegendData({ breaks, min, max })
        setupTooltipHandlers(map, popup, metric)
        setIsLoading(false)
      } catch (err) {
        console.error("Error setting up data layer:", err)
        setIsLoading(false)
      }
    })
  }, [setupTooltipHandlers])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !currentDataset || !currentRegion) return

    // Setup PMTiles protocol
    const protocol = new Protocol()
    maplibregl.addProtocol("pmtiles", protocol.tile)
    protocolRef.current = protocol

    const pmtiles = new PMTiles(currentDataset.pmtilesUrl)
    protocol.add(pmtiles)

    const initMap = async () => {
      try {
        await pmtiles.getHeader()

        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          zoom: currentRegion.initialZoom,
          minZoom: currentRegion.minZoom,
          maxZoom: currentRegion.maxZoom,
          center: currentRegion.center,
          style: {
            version: 8,
            sources: {
              basemap: {
                type: "raster",
                tiles: ["https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"],
                tileSize: 256,
              },
              "pmtiles-source": {
                type: "vector",
                url: `pmtiles://${currentDataset.pmtilesUrl}`,
              },
            },
            layers: [
              {
                id: "basemap",
                type: "raster",
                source: "basemap",
              },
            ],
          },
        })

        mapRef.current = map

        // Add navigation control
        map.addControl(new maplibregl.NavigationControl(), "top-right")

        // Create popup
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "maplibre-popup",
        })
        popupRef.current = popup

        // Setup data layer on load
        map.on("load", () => {
          if (currentMetric) {
            setupDataLayer(map, popup, currentDataset, currentMetric)
          }
        })
      } catch (error) {
        console.error("Error initializing map:", error)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      maplibregl.removeProtocol("pmtiles")
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Only run on mount

  // Handle metric change
  useEffect(() => {
    if (!mapRef.current || !popupRef.current || !currentDataset || !currentMetric) return

    setIsLoading(true)
    setupDataLayer(mapRef.current, popupRef.current, currentDataset, currentMetric)
  }, [selectedMetric, currentDataset, currentMetric, setupDataLayer])

  // Handle region change
  const handleRegionChange = useCallback((regionId: string) => {
    setSelectedRegion(regionId)
    setIsLoading(true)

    const region = regions[regionId]
    if (mapRef.current && region) {
      mapRef.current.flyTo({
        center: region.center,
        zoom: region.initialZoom,
        duration: 2000,
      })

      setTimeout(() => setIsLoading(false), 3000)
    }
  }, [])

  // Handle dataset change
  const handleDatasetChange = useCallback((datasetId: string) => {
    const newDataset = datasets[datasetId]
    if (!newDataset) return

    setSelectedDataset(datasetId)
    setSelectedMetric(newDataset.defaultMetric)
    setSelectedRegion(newDataset.defaultRegion)

    // Reload the page to reinitialize with new PMTiles source
    // This is simpler than dynamically swapping sources
    window.location.reload()
  }, [])

  if (!currentDataset || !currentMetric) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainerRef} className="w-full h-screen" />

      <DatasetSelector
        datasets={datasetList}
        selectedDataset={selectedDataset}
        onDatasetChange={handleDatasetChange}
        disabled={isLoading}
      />

      <RegionSelector
        regions={availableRegions}
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
        disabled={isLoading}
      />

      <h1 className="absolute top-16 left-0 right-0 text-center text-white text-2xl font-bold z-10 drop-shadow-md pointer-events-none">
        {currentRegion?.name} - {currentDataset.name}
      </h1>

      <MetricSelector
        metrics={currentDataset.metrics}
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        disabled={isLoading}
      />

      <Legend
        metric={currentMetric}
        breaks={legendData.breaks}
        min={legendData.min}
        max={legendData.max}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
          <div className="bg-white p-4 rounded-md">
            <p className="text-gray-800">Loading data...</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .maplibre-popup {
          max-width: 240px;
        }
        .maplibre-popup .maplibregl-popup-content {
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 4px;
          padding: 8px;
        }
        .popup-content {
          padding: 4px;
        }
        .popup-title {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .popup-value {
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default MapViewer

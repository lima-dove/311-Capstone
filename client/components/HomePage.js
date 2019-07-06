import Button from '@material-ui/core/Button'
import {withStyles} from '@material-ui/core/styles'
import axios from 'axios'
import React, {Component} from 'react'
import MapGL, {FlyToInterpolator, Marker, Popup} from 'react-map-gl'
import BarGraph from './BarGraphTest'
import redPointer from '../../markers/red-marker.png'
import greenPointer from '../../markers/green-marker.png'
import greenDot from '../../markers/green-circle.png'
import redDot from '../../markers/red-circle.png'
import {green} from '@material-ui/core/colors'
import SearchBar from './SearchBar'

const styles = theme => ({
  button: {
    margin: theme.spacing(1),
    justifySelf: 'center'
  }
})

const dotStyle = {width: '15px', height: '15px'}

const token =
  'pk.eyJ1IjoibnNjaGVmZXIiLCJhIjoiY2p2Mml0azl1MjVtejQ0bzBmajZhOHViZCJ9.iPyB8tGgsYgboP_fKLQGnw'

class HomePage extends Component {
  constructor() {
    super()
    this.state = {
      complaints: [],
      neighborhoodComplaints: null,
      boundaryAddresses: null,
      selectedNeighborhood: null,
      selectedAddress: null,
      data: null,
      selectedMarkerImage: null,
      selectedDotImage: null,
      viewport: {
        latitude: 40.7484,
        longitude: -73.9857,
        zoom: 12,
        bearing: 0,
        pitch: 0
      }
    }
    this.handleSearchClick = this.handleSearchClick.bind(this)
    this.handleMapClick = this.handleMapClick.bind(this)
    this.handleNeighborhoodMarkerClick = this.handleNeighborhoodMarkerClick.bind(
      this
    )
    this.handleSeeMoreClick = this.handleSeeMoreClick.bind(this)
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this)
    this.handleAddressMarkerClick = this.handleAddressMarkerClick.bind(this)
    this.mapRef = React.createRef()
  }

  async componentDidMount() {
    const {data} = await axios.get(`/api/map/getAll`)
    this.setState({
      neighborhoodComplaints: data
    })
  }

  async handleSearchClick() {
    let boundary = this.mapRef.getMap().getBounds()
    const northLat = boundary._ne.lat
    const southLat = boundary._sw.lat
    const westLng = boundary._sw.lng
    const eastLng = boundary._ne.lng
    const {data} = await axios.get(
      `/api/map/searchByArea/${northLat},${southLat},${westLng},${eastLng}`
    )
    console.log(data)
    this.setState({boundaryAddresses: data})
  }

  async handleAddressMarkerClick(event, address) {
    let dot
    if (this.state.selectedDotImage) {
      dot = this.state.selectedDotImage
      dot.src = greenDot
    }
    event.target.src = redDot
    this.setState({
      selectedDotImage: event.target
    })
    console.log('ADDRESS========', address)
    let response
    if (address.incident_address) {
      response = await axios.get(
        `api/map/getAddress/A${address.incident_address}`
      )
    } else {
      response = await axios.get(
        `api/map/getAddress/C${address.latitude},${address.longitude}`
      )
    }
    await this.setState({
      selectedAddress: response.data
    })
  }

  handleNeighborhoodMarkerClick = (event, neighborhoodAggregate) => {
    console.log(neighborhoodAggregate)
    //Popup Logic requires selectedAddress
    // THE BELOW IS SPECIFICALLY FOR AGGREGATES
    let marker
    if (this.state.selectedMarkerImage) {
      marker = this.state.selectedMarkerImage
      marker.src = greenPointer
    }
    event.target.src = redPointer
    let data = neighborhoodAggregate.complaints.map(complaintAggregate => {
      console.log({complaintAggregate})
      let aggregateObj = {
        type: complaintAggregate[0],
        frequency: complaintAggregate[1]
      }
      return aggregateObj
    })
    console.log('handlemarkerclick object', data)

    this.setState({
      selectedNeighborhood: {
        incident_address: neighborhoodAggregate.name,
        location: {
          coordinates: [
            neighborhoodAggregate.latitude,
            neighborhoodAggregate.longitude
          ]
        }
      },
      data,
      selectedMarkerImage: event.target
    })
    console.log('NEIGHBORRHOOD===', this.state.selectedNeighborhood)
  }

  handleMapClick = e => {
    e.preventDefault()
    // Add other logic to close popup
    // this.setState({
    //   selectedAddress: null
    // })
  }

  handleSeeMoreClick = complaint => {
    //Redirect to Info Page Logic
    const {history} = this.props
    let clickedAddress
    if (complaint.incident_address) {
      clickedAddress = complaint.incident_address.replace(/ /g, '-')
    } else {
      clickedAddress = ''
    }
    //pushes the complaint data as state to history object
    //can now the be accessed using history.state.state
    history.push(`/exampleComplaints/${clickedAddress}`, complaint)
  }

  handleViewChange = viewport => {
    if (viewport.zoom < 15.5) {
      this.setState({viewport: viewport, boundaryAddresses: null})
    } else {
      this.setState({viewport: viewport})
    }
  }

  async handleSearchSubmit(address) {
    const {data} = await axios.get(`api/map/getAddress/A${address}`)
    this.setState({
      selectedAddress: data,
      viewport: {
        latitude: data.latitude,
        longitude: data.longitude,
        zoom: 18,
        bearing: 0,
        pitch: 0
      }
    })
  }

  render() {
    console.log('SELECTED_ADDRESS===', this.state.selectedAddress)
    const {classes} = this.props

    const {
      boundaryAddresses,
      viewport,
      selectedAddress,
      selectedNeighborhood,
      selectedMarkerImage,
      selectedDotImage,
      data,
      neighborhoodComplaints
    } = this.state

    const scrollZoom = !selectedMarkerImage && !selectedDotImage

    return (
      <div>
        <MapGL
          id="mapGl"
          scrollZoom={scrollZoom}
          {...viewport}
          width="100vw"
          height="88vh"
          mapStyle="mapbox://styles/mapbox/streets-v9"
          onViewportChange={v => this.handleViewChange(v)}
          preventStyleDiffing={false}
          ref={map => (this.mapRef = map)}
          mapboxApiAccessToken={token}
          onClick={this.handleMapClick}
          transitionDuration={selectedAddress ? 2000 : 0}
          transitionInterpolator={
            selectedAddress ? new FlyToInterpolator() : null
          }
        >
          <div style={{display: 'flex'}}>
            <SearchBar
              handleSearchSubmit={this.handleSearchSubmit}
              captureClick={true}
            />
            {selectedAddress ? (
              <Marker
                latitude={selectedAddress.latitude}
                longitude={selectedAddress.longitude}
                offsetLeft={-20}
                offsetTop={-10}
              >
                <img
                  style={dotStyle}
                  src={greenDot}
                  onClick={() =>
                    this.handleAddressMarkerClick(event, selectedAddress)
                  }
                />
              </Marker>
            ) : null}
            {this.state.viewport.zoom > 15.5 ? (
              <div>
                <div style={{display: 'flex'}}>
                  <Button
                    onClick={this.handleSearchClick}
                    variant="contained"
                    className={classes.button}
                  >
                    Search this area
                  </Button>
                </div>
                {boundaryAddresses
                  ? boundaryAddresses.map(address => {
                      return (
                        <Marker
                          key={address.id}
                          latitude={address.latitude}
                          longitude={address.longitude}
                          offsetLeft={-20}
                          offsetTop={-10}
                        >
                          <img
                            style={dotStyle}
                            src={greenDot}
                            onClick={event =>
                              this.handleAddressMarkerClick(event, address)
                            } // THIS FUNCTION NEEDS TO BE WRITTEN
                          />
                        </Marker>
                      )
                    })
                  : null}
              </div>
            ) : (
              <div>
                {neighborhoodComplaints
                  ? neighborhoodComplaints.map(complaint => {
                      return (
                        <Marker
                          key={complaint.id}
                          latitude={complaint.latitude}
                          longitude={complaint.longitude}
                          offsetLeft={-20}
                          offsetTop={-10}
                        >
                          <img
                            src={greenPointer}
                            onClick={event =>
                              this.handleNeighborhoodMarkerClick(
                                event,
                                complaint
                              )
                            }
                          />
                        </Marker>
                      )
                    })
                  : null}
              </div>
            )}
          </div>
          {selectedNeighborhood ? (
            <Popup
              latitude={this.state.viewport.latitude}
              longitude={this.state.viewport.longitude}
              style={{maxWidth: '200px'}}
              onClose={() => {
                const marker = this.state.selectedMarkerImage
                marker.src = greenPointer
                this.setState({
                  selectedNeighborhood: null,
                  selectedMarkerImage: null
                })
              }}
              className="popup"
            >
              <div>
                <BarGraph rawData={data} />
                <h1>
                  Total Complaints for {selectedNeighborhood.incident_address}:
                </h1>
              </div>
            </Popup>
          ) : null}
          {/* SelectedAddress logic: Click a marker neighborhood ONLY */}
          {selectedAddress ? (
            <Popup
              latitude={this.state.viewport.latitude}
              longitude={this.state.viewport.longitude}
              style={{maxWidth: '200px'}}
              onClose={() => {
                const dot = this.state.selectedDotImage
                dot.src = greenDot
                this.setState({
                  selectedDotImage: null,
                  selectedAddress: null
                })
              }}
              className="popup"
            >
              <div>
                <BarGraph rawData={selectedAddress.aggregate_data} />
                <h1>
                  Total Complaints for {selectedAddress.incident_address}:
                </h1>
                <h3>Complaint Type: {selectedAddress.complaint_type}</h3>
                <p>Description: {selectedAddress.descriptor}</p>
                <button
                  type="button"
                  onClick={() => this.handleSeeMoreClick(selectedAddress)}
                >
                  See More...
                </button>
              </div>
            </Popup>
          ) : null}
        </MapGL>
      </div>
    )
  }
}

export default withStyles(styles)(HomePage)
// Function maybe:
/* Get neighborhood:

*/

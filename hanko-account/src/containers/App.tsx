import * as React from 'react'
import { RegisteredDevices } from '../components/RegisteredDevices'
import { AddHankoAuthenticator } from '../components/AddHankoAuthenticator'
import { fetchApi } from '../utils/fetchApi'
import { deviceFromJson, Device } from '../models/Device'
import { ChangePasswordComponent } from '../components/ChangePasswordComponent'
import glamorous from 'glamorous'
import { AddWebAuthn } from '../components/AddWebAuthn'

type AppState = {
  showAddHankoAuthenticator: boolean
  showAddPlatformAuthenticator: boolean
  devices: Device[] | undefined
}

type AppProps = {
  keycloak: Keycloak.KeycloakInstance
}

const ContentWrapper = glamorous.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1
})

export class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      showAddHankoAuthenticator: false,
      showAddPlatformAuthenticator: false,
      devices: undefined
    }
  }

  componentDidMount() {
    this.fetchDevices()
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
        userIntent => {
          this.setState({ showAddPlatformAuthenticator: userIntent })
        }
      )
    }
  }

  showAddHankoAuthenticator = () => {
    this.setState({ showAddHankoAuthenticator: true })
  }

  hideAddHankoAuthenticator = () => {
    this.setState({ showAddHankoAuthenticator: false })
  }

  completionHandler = () => {
    this.hideAddHankoAuthenticator()
    this.setState({ devices: undefined })
    this.fetchDevices()
  }

  fetchDevices = () => {
    const { keycloak } = this.props

    fetchApi(keycloak, '/hanko/devices').then(jsonArray => {
      const devices = (jsonArray as any[]).map(json => deviceFromJson(json))
      this.setState({ devices: devices })
    })
  }

  b64DecodeUnicode = (str: string) => {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c: any) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
  }

  parseJwt = (token: String) => {
    var base64Url = token.split('.')[1]
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(this.b64DecodeUnicode(base64))
  }

  render() {
    const { keycloak } = this.props

    const token = keycloak.token
    const jwt = token ? this.parseJwt(token) : {}
    const username = jwt.name ? jwt.name : ''
    const email = jwt.email ? jwt.email : ''

    const {
      showAddHankoAuthenticator,
      showAddPlatformAuthenticator,
      devices
    } = this.state

    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirectUrl')
    const redirectNameParam = urlParams.get('redirectName')
    const redirectLinkText = redirectNameParam ? redirectNameParam : 'return'

    const logo =
      process.env.NODE_ENV !== 'production'
        ? (require('../images/logo.png') as string)
        : `${__webpack_public_path__}../img/logo.png`

    return (
      <ContentWrapper>
        <div className="navigation-bar">
          <div className="flex row">
            <a
              className="navigation-bar-header-link"
              href={redirectParam ? redirectParam : ''}
            >
              <img className="navbar-logo" src={logo} />
            </a>
            <span className="navbar-header">Manage Account</span>
          </div>
          {redirectParam ? (
            <a className="navigation-bar-link" href={redirectParam}>
              &#9668; {redirectLinkText}
            </a>
          ) : null}
        </div>
        <div id="content">
          <div className="center column">
            <div className="container">
              <h1>My Account</h1>
              <div className="formfield">
                <label>Name</label>
                <span>{username}</span>
              </div>
              <div className="formfield">
                <label>E-Mail</label>
                <span>{email}</span>
              </div>
            </div>
            <div className="container">
              <h1>Registered Devices</h1>
              {devices === undefined ? (
                <div>Loading...</div>
              ) : (
                <RegisteredDevices
                  keycloak={keycloak}
                  devices={devices}
                  deviceDeletedHandler={this.fetchDevices}
                />
              )}

              <div className="margin-bottom" />

              {showAddHankoAuthenticator ? (
                <AddHankoAuthenticator
                  keycloak={keycloak}
                  cancelHandler={this.hideAddHankoAuthenticator}
                  completionHandler={this.completionHandler}
                />
              ) : (
                <div className="button-list">
                  <button onClick={this.showAddHankoAuthenticator}>
                    Add Hanko Authenticator
                  </button>
                  <AddWebAuthn
                    refetch={this.fetchDevices}
                    keycloak={keycloak}
                    type="roaming"
                  >
                    Add Security Key
                  </AddWebAuthn>
                  {showAddPlatformAuthenticator ? (
                    <AddWebAuthn
                      refetch={this.fetchDevices}
                      keycloak={keycloak}
                      type="platform"
                    >
                      Add Windows Hello
                    </AddWebAuthn>
                  ) : null}
                </div>
              )}
            </div>
            <ChangePasswordComponent keycloak={keycloak} />
          </div>
        </div>
      </ContentWrapper>
    )
  }
}

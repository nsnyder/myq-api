// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js
const axios = require('axios');

const constants = require('./constants');

class ErrorHandler {};
ErrorHandler.prototype.returnError = (returnCode, err) => {
  const result = {
    returnCode,
    message: constants.errorMessages[returnCode],
  };
  if (err) {
    result.unhandledError = err;
  }
  return result;
};
ErrorHandler.prototype.handleBadResponse = (response) => {
  // TODO: Handle these granularly.
  return this.prototype.returnError(11);
};

class MyQ {
  // Build the object and initialize any properties we're going to use.
  constructor(username, password) {
    this.accountId = null;
    this.username = username;
    this.password = password;
    this.securityToken = null;
  }

  async login() {
    if (!this.username || !this.password) {
      return Promise.resolve(ErrorHandler.prototype.returnError(14));
    }

    return Promise.resolve(
      this.executeRequest(
        constants.routes.login,
        'post',
        null,
        {
          Username: this.username,
          Password: this.password,
        }
      )
        .then(response => {
          //console.log(response);
          if (!response || !response.data) {
            return ErrorHandler.prototype.returnError(12);
          }

          const { data } = response;
          switch (response.status) {
            case 200:
              const token = data.SecurityToken;
              if (!token) {
                return ErrorHandler.prototype.returnError(11);
              }

              this.securityToken = token;
              return {
                returnCode: 0,
                token: data.SecurityToken,
              };
            case 203:
              return ErrorHandler.prototype.returnError(14);
            case 205:
              return ErrorHandler.prototype.returnError(16);
            case 207:
              return ErrorHandler.prototype.returnError(17);
            default:
              return ErrorHandler.prototype.returnError(11);
          }
        })
        .catch(err => {
          if (err.statusCode === 500) {
            return ErrorHandler.prototype.returnError(14);
          }

          return ErrorHandler.prototype.returnError(11, err);
        })
    );
  }

  async executeRequest(route, method, params, data) {
    let isLoginRequest = route === constants.routes.login;
    let headers = {
      "Content-Type": "application/json",
      "MyQApplicationId": constants.appId,
      "User-Agent": constants.userAgent,
    };

    // If there's not a security token, and we're not logging in, throw an error.
    if (!isLoginRequest && !this.securityToken) {
      return Promise.resolve(ErrorHandler.prototype.returnError(13));
    } else if (!isLoginRequest) {
      // Add our security token to the headers.
      headers.SecurityToken = this.securityToken;
    }
    let config = {
      method,
      url: `${constants.endpointBase}/${route}`,
      headers,
    };
    if (!!data) {
      config.data = data;
    }
    if (!!params) {
      config.params = params;
    }

    return Promise.resolve(
      axios(config)
        .then(response => {
          if (response.status !== 200) {
            return ErrorHandler.prototype.handleBadResponse(response);
          }
          return response;
        })
    );
  }

  async getAccountInfo() {
    return this.executeRequest(
      constants.routes.account,
      'get',
      { expand: 'account' }
    )
      .then(({ data }) => {
        if (!data || !data.Account || !data.Account.Id) {
          return ErrorHandler.prototype.returnError(11);
        }
        this.accountId = data.Account.Id;
      })
      .catch((error) => ErrorHandler.prototype.returnError(11, error));
  }

  async getDevices(deviceTypeParams) {
    if (deviceTypeParams === null) {
      return Promise.resolve(ErrorHandler.prototype.returnError(15));
    }

    let promise = Promise.resolve(() => null);
    if (!this.accountId) {
      promise = Promise.resolve(this.getAccountInfo());
    }

    const deviceTypes = !deviceTypeParams ?
      [] :
      (Array.isArray(deviceTypeParams) ? deviceTypeParams : [deviceTypeParams]);

    // TODO: Validate device types when we have a more complete list.
    for (let deviceType in deviceTypes) {
      if (!constants.allDeviceTypes.includes(deviceType)) {
        // return ErrorHandler.prototype.returnError(15);
      }
    }

    return promise
      .then(() => this.executeRequest(
        `${constants.routes.getDevices.replace('{accountId}', this.accountId)}`,
        'get'
      ))
      .then((response) => {
        const { data } = response;
        let devices = data.items;
        if (!devices) {
          return ErrorHandler.prototype.returnError(11);
        }

        if (deviceTypes.length) {
          devices = devices.filter(device => deviceTypes.includes(device.device_type));
        }

        const result = {
          returnCode: 0,
        };

        const modifiedDevices = [];
        for (const device of devices) {
          const modifiedDevice = {
            family: device.device_family,
            name: device.name,
            type: device.device_type,
            serialNumber: device.serial_number,
          };

          const state = device.state;
          if (constants.myQProperties.online in state) {
            modifiedDevice.online = state[constants.myQProperties.online];
          }
          if (constants.myQProperties.doorState in state) {
            modifiedDevice.doorState = state[constants.myQProperties.doorState];
            const date = new Date(state[constants.myQProperties.lastUpdate]);
            modifiedDevice.doorStateUpdated = date.toLocaleString();
          }
          if (constants.myQProperties.lightState in state) {
            modifiedDevice.lightState = state[constants.myQProperties.lightState];
            const date = new Date(state[constants.myQProperties.lastUpdate]);
            modifiedDevice.lightStateUpdated = date.toLocaleString();
          }

          modifiedDevices.push(modifiedDevice);
        }
        result.devices = modifiedDevices;
        return result;
      })
      .catch(err => ErrorHandler.prototype.returnError(11, err));
  }

  async getDeviceState(serialNumber, attributeName) {
    return this.getDevices()
      .then(response => {
        const device = (response.devices || []).find(device => device.serialNumber === serialNumber);
        if (!device) {
          return ErrorHandler.prototype.returnError(18);
        } else if (!(attributeName in device)) {
          return ErrorHandler.prototype.returnError(19);
        }

        const result = {
          returnCode: 0,
          state: device[attributeName],
        };
        return result;
      })
      .catch(err => {
        if (err.statusCode === 400) {
          return ErrorHandler.prototype.returnError(15);
        }

        return ErrorHandler.prototype.returnError(11, err);
      });
  };

  async getDoorState(serialNumber) {
    return this.getDeviceState(serialNumber, 'doorState')
      .then(result => {
        if (result.returnCode !== 0) {
          return result;
        }

        const newResult = JSON.parse(JSON.stringify(result));
        newResult.doorState = newResult.state;
        delete newResult.state;
        return newResult;
      })
      .catch(err => ErrorHandler.prototype.returnError(11, err));
  }

  async getLightState(serialNumber) {
    return this.getDeviceState(serialNumber, 'lightState')
      .then(result => {
        if (result.returnCode !== 0) {
          return result;
        }

        const newResult = JSON.parse(JSON.stringify(result));
        newResult.lightState = newResult.state;
        delete newResult.state;
        return newResult;
      })
      .catch(err => ErrorHandler.prototype.returnError(11, err));
  }

  async setDeviceState(serialNumber, action) {
    return this.executeRequest(
      `${constants.routes.setDevice.replace('{accountId}', this.accountId).replace('{serialNumber}', serialNumber)}`,
      'put',
      null,
      { action_type: action }
    )
      .then(response => {
        console.log(response);
        if (!response || !response.data) {
          return ErrorHandler.prototype.returnError(12);
        }

        const { data } = response;

        if (data.ReturnCode === '-3333') {
          return ErrorHandler.prototype.returnError(13);
        } else if (!data.ReturnCode) {
          return ErrorHandler.prototype.returnError(11);
        }

        const result = {
          returnCode: 0,
        };
        return result;
      })
      .catch(err => {
        if (err.statusCode === 500) {
          return ErrorHandler.prototype.returnError(15);
        }

        return ErrorHandler.prototype.returnError(11, err);
      });
  };

  async setDoorState(serialNumber, action) {
    return this.setDeviceState(serialNumber, action)
      .then(result => result);
  }

  async setLightState(serialNumber, action) {
    return this.setDeviceState(serialNumber, action)
      .then(result => result);
  }
}

module.exports = MyQ;

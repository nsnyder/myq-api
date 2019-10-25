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
  return Promise.resolve(result);
};
ErrorHandler.prototype.parseBadResponse = (response) => {
  let error = ErrorHandler.prototype.returnError(11);
  if (!response || !response.status) {
    error = ErrorHandler.prototype.returnError(12);
  }
  if (response.status === 401) {
    return ErrorHandler.prototype.returnError(14);
  }

  return error;
};

class MyQ {
  // Build the object and initialize any properties we're going to use.
  constructor(username, password) {
    this.accountId = null;
    this.username = username;
    this.password = password;
    this.securityToken = null;
  }

  login() {
    if (!this.username || !this.password) {
      return ErrorHandler.prototype.returnError(14);
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
        .catch(error => {
          const { response } = error;
          return ErrorHandler.prototype.parseBadResponse(response);
        })
    );
  }

  checkIsLoggedIn() {
    return !!this.securityToken;
  }

  executeRequest(route, method, params, data) {
    let isLoginRequest = route === constants.routes.login;
    let headers = {
      "Content-Type": "application/json",
      "MyQApplicationId": constants.appId,
      "User-Agent": constants.userAgent,
    };

    // If there's not a security token, and we're not logging in, throw an error.
    if (!isLoginRequest && !this.securityToken) {
      return ErrorHandler.prototype.returnError(13);
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

    return Promise.resolve(axios(config))
      .then(response => ({
        returnCode: 0,
        response,
      }));
  }

  getAccountInfo() {
    return this.executeRequest(
      constants.routes.account,
      'get',
      { expand: 'account' }
    )
      .then(returnValue => {
        if (returnValue.returnCode !== 0 && typeof(returnValue.returnCode) !== 'undefined') {
          return returnValue;
        }
        const { data } = returnValue.response;
        if (!data || !data.Account || !data.Account.Id) {
          return ErrorHandler.prototype.returnError(11);
        }
        this.accountId = data.Account.Id;
      })
      .catch((error) => ErrorHandler.prototype.returnError(11, error));
  }

  getDevices(deviceTypeParams) {
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
      .then(returnValue => {
        if (returnValue.returnCode !== 0 && typeof(returnValue.returnCode) !== 'undefined') {
          return returnValue;
        }

        if (![200, 204].includes(returnValue.status)) {
          return ErrorHandler.prototype.parseBadResponse(returnValue.response);
        }

        const { data } = returnValue;
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

  getDeviceState(serialNumber, attributeName) {
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

  getDoorState(serialNumber) {
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

  getLightState(serialNumber) {
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

  setDeviceState(serialNumber, action) {
    let promise = Promise.resolve(() => null);
    if (!this.accountId) {
      promise = Promise.resolve(this.getAccountInfo());
    }

    return promise
      .then(() => this.executeRequest(
        `${constants.routes.setDevice.replace('{accountId}', this.accountId).replace('{serialNumber}', serialNumber)}`,
        'put',
        null,
        { action_type: action }
      ))
      .then(returnValue => {
        const { returnCode, response } = returnValue;
        if (returnCode !== 0 && typeof(returnCode) !== 'undefined') {
          return returnValue;
        }

        if ([200, 204].includes(response.status)) {
          return {
            returnCode: 0,
          };
        }

        return ErrorHandler.prototype.parseBadResponse(response);
      })
      .catch(err => {
        if (err.statusCode === 500) {
          return ErrorHandler.prototype.returnError(15);
        }

        return ErrorHandler.prototype.returnError(11, err);
      });
  };

  setDoorOpen(serialNumber, shouldOpen) {
    let action = constants.doorCommands.close;
    if (shouldOpen) {
      action = constants.doorCommands.open;
    }
    return this.setDeviceState(serialNumber, action);
  }

  setLightState(serialNumber, turnOn) {
    let action = constants.lightCommands.off;
    if (turnOn) {
      action = constants.lightCommands.on;
    }
    return this.setDeviceState(serialNumber, action);
  }
}

module.exports = MyQ;

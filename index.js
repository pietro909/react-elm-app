'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _jsxFileName = 'src/main.js';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var bootstrapElm = function bootstrapElm(elmApp, node) {
  var flags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return new Promise(function (resolve) {
    var app = elmApp.embed(node, flags);
    requestAnimationFrame(function () {
      return resolve(app);
    });
  });
};

/* eslint-disable no-console */
var genericLogger = function genericLogger(logger) {
  return function (label, data) {
    console.group(label);
    if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && typeof data.forEach === 'function') {
      data.forEach(function (a) {
        return logger(a);
      });
    } else {
      logger(data);
    }
    console.groupEnd();
  };
};
/* eslint-enable no-console */

var checkPorts = function checkPorts(expected, actual) {
  var orphans = actual.slice(0);
  var rest = expected.reduce(function (acc, p) {
    var index = orphans.indexOf(p);
    if (index > -1) {
      orphans.splice(index, 1);
      return acc;
    }
    return [p].concat(_toConsumableArray(acc));
  }, []);
  if (rest.length > 0) {
    console.error('Port(s) not found: ' + rest.join(',') + '\n\t\t');
  }
  if (orphans.length > 0) {
    console.error('Unknown ports: ' + orphans.join(',') + '\n\t\t');
  }
};

var noop = function noop() {
  return null;
};

var appWithElm = function appWithElm(Elm) {
  return function (_ref) {
    var appName = _ref.appName,
        startMessage = _ref.startMessage,
        debug = _ref.debug,
        expectedPorts = _ref.expectedPorts,
        htmlNode = _ref.htmlNode,
        initPortName = _ref.initPortName;
    return function (WrappedComponent) {
      /* eslint-disable no-console */
      var log = debug ? genericLogger(console.log) : noop;
      var warn = debug ? genericLogger(console.warn) : noop;
      /* eslint-enable no-console */

      return function (_Component) {
        _inherits(_class, _Component);

        function _class(props) {
          _classCallCheck(this, _class);

          var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, props));

          _this.state = {
            ports: {},
            ready: !initPortName,
            incoming: {},
            outgoing: {}
          };
          var elmApp = Elm[appName];

          if (!elmApp) {
            throw new TypeError('The application ' + appName + ' can\'t be found!');
          }

          bootstrapElm(elmApp, htmlNode).then(function (app) {
            var portsOut = [];
            var portsIn = [];
            Object.keys(app.ports).forEach(function (portId) {
              var port = app.ports[portId];
              if (port.subscribe) {
                if (portId === initPortName) {
                  var callback = function callback(data) {
                    return (
                      /* eslint-disable no-undef */
                      requestAnimationFrame(function () {
                        /* eslint-enable no-undef */
                        log('receive ' + portId, data);
                        _this.setState(function () {
                          return {
                            ports: app.ports,
                            ready: true
                          };
                        });
                        port.unsubscribe(callback);
                      })
                    );
                  };
                  port.subscribe(callback);
                  return;
                }
                portsOut.push(portId);
                port.subscribe(function (data) {
                  return _this.setState(function () {
                    log('receive ' + portId, data);
                    return {
                      incoming: _extends({}, _this.state.incoming, _defineProperty({}, portId, data))
                    };
                  });
                });
              } else if (port.send) {
                portsIn.push(portId);
                _this.setState(function () {
                  return {
                    outgoing: _extends({}, _this.state.outgoing, _defineProperty({}, portId, function () {
                      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                      }

                      log('send ' + portId, args);
                      port.send.apply(port, args);
                    }))
                  };
                });
              }
            });

            log('Outgoing ports', portsOut);
            log('Incoming ports', portsIn);

            checkPorts(expectedPorts.in, portsOut);
            checkPorts(expectedPorts.out, portsIn);
          });
          return _this;
        }

        _createClass(_class, [{
          key: 'render',
          value: function render() {
            if (this.state.ready) {
              return _react2.default.createElement(WrappedComponent, {
                ports: this.state.ports,
                incoming: this.state.incoming,
                outgoing: this.state.outgoing,
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 130
                },
                __self: this
              });
            }
            return _react2.default.createElement(
              'div',
              {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 137
                },
                __self: this
              },
              'Loading...'
            );
          }
        }]);

        return _class;
      }(_react.Component);
    };
  };
};

exports.default = appWithElm;

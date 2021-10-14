/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {Buffer} from 'buffer';
import {Text} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import {useState} from 'react';

const manager = new BleManager();
const App = () => {
  const [calculatedWeight, setCalculatedWeight] = useState('');
  const MI_SCALE = 'MIBFS';
  const BODY_COMPOSITION_MEASUREMENT = '00002a9c-0000-1000-8000-00805f9b34fb';

  function getCharacteristics(device) {
    return new Promise((resolve, reject) => {
      device.services().then(services => {
        const characteristics = [];
        services.forEach((service, i) => {
          service.characteristics().then(c => {
            characteristics.push(c);
            for (let i = 0; i < characteristics.length; i++) {
              for (const character of characteristics[i]) {
                if (character.uuid === BODY_COMPOSITION_MEASUREMENT) {
                  character.monitor((err, update) => {
                    if (err) {
                      console.log(`characteristic error: ${err}`);
                      console.log(JSON.stringify(err));
                    } else {
                      const buffer = Buffer.from(update.value, 'base64');
                      const isStabilized =
                        buffer.toString('hex').slice(2, 4) === '26'
                          ? true
                          : false;

                      const weight_bytes = buffer.toString('hex').slice(22);

                      if (isStabilized) {
                        const weight =
                          Buffer.from(weight_bytes, 'hex').readInt16LE() / 200;

                        setCalculatedWeight(weight);
                        resolve(weight);
                      }
                      //manager.cancelDeviceConnection();
                    }
                  });

                  return;
                }
              }
            }
          });
        });
      });
    });
  }

  const scanAndConnect = async () => {
    console.log('Scanning Started');
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        // Handle error (scanning will be stopped automatically)
        console.log('Error in scanning devices:', error);
        return;
      }

      console.log('Detected Device Details:', device.id, device.name);

      if (device.name === MI_SCALE) {
        console.log(MI_SCALE, 'FOUNDED!');
        console.info('Discovering services and characteristics');
        manager.stopDeviceScan();

        manager
          .connectToDevice(device.id)
          .then(device => {
            (async () => {
              const services =
                await device.discoverAllServicesAndCharacteristics();
              const characteristic = await getCharacteristics(services);

              console.log(
                'Discovering services and characteristics',
                characteristic.uuid,
              );
            })();
            return device.discoverAllServicesAndCharacteristics();
          })
          .then(device => {
            // return this.setupNotifications(device)
          })
          .then(
            () => {
              console.log('Listening...');
            },
            error => {
              this.alert('Connection error' + JSON.stringify(error));
            },
          );
      }
    });
  };

  scanAndConnect();

  return (
    <>
      <Text>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</Text>

      <Text>{calculatedWeight ? calculatedWeight : null}</Text>
    </>
  );
};

export default App;

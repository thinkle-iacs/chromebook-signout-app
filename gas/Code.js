// Run setSecret() once from the Apps Script editor to store the secret,
// then delete or replace the value in setSecret before committing.
// DO NOT COMMIT this file while it contains the real secret.
function setSecret() {
  PropertiesService.getScriptProperties().setProperty('SHIM_SECRET', 'TYPE_SECRET_HERE');
}

function getSecret() {
  return PropertiesService.getScriptProperties().getProperty('SHIM_SECRET');
}

function makeResult (e, object) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status : 'success',
      parameters: e.parameters,
      result : object
    })
  )
}

function makeErrorMessage (e, details={}) {
  return ContentService.createTextOutput(
      JSON.stringify(
        {
          status : 'Error',
          parameters : e.parameters,
          ...details}
        )
  )
}

function doGet (e) {
  // Provide a Web API for getting Chromebook info
  if (e.parameters.secret != getSecret()) {
    // Ensure they have provided our SECRET! Top SECRET SECURITY! ;-\
    return ContentService.createTextOutput("no access, sorry -- you don't know the secret!");
  }
  // Parameters are provided as lists, annoyingly... make a simplified object for convenience
  let params = {};
  for (let key in e.parameters) {
    if (e.parameters[key]?.length) {
      params[key] = e.parameters[key][0];
    }
  }
  // Serial mode: search by chromebooks
  // request should look like
  // ?secret=SECRET&mode=serial&id=098asdfuoalksdjf
  if (params.mode === 'serial') {
    if (!params.id) { // throw error if no ID=
      return makeErrorMessage(e,{
        detail : 'No id provided with mode=serial'
      })
    } else {
      try { // return data if successful
        return makeResult(e,cbBySerial(params.id));
      } catch (error) { // report runtime error
        return makeErrorMessage(e,{
          detail : 'Error running cbBySerial',
          error
        });
      }
    }
  } else if (params.mode === 'user') { 
    // User mode: search Chromebook by recent_user
    // Request should look like
    // ?secret=SECRET&mode=user&user=thinkle@innovationcharter.org
    if (!params.user) {
      return makeErrorMessage(e, {
        detail : 'No user provided with mode=user'
      })
    } else {
      try {
        return makeResult(e,cbByUser(params.user))
      } catch (error) {
        return makeErrorMessage(
          e,
          {detail : 'Error running cbByUser',error}
        );
      }
    }
  } else if (params.mode === 'action') {
    // Action mode: disable or reenable a device by serial number
    // ?secret=SECRET&mode=action&serial=5CD119166D&action=disable|reenable
    const allowed = ['disable', 'reenable'];
    if (!params.serial) {
      return makeErrorMessage(e, { detail: 'No serial provided with mode=action' });
    }
    if (!allowed.includes(params.action)) {
      return makeErrorMessage(e, { detail: `Invalid action "${params.action}": expected disable or reenable` });
    }
    try {
      const device = cbBySerial(params.serial);
      if (!device) {
        return makeErrorMessage(e, { detail: `Device not found for serial: ${params.serial}` });
      }
      AdminDirectory.Chromeosdevices.action(
        { action: params.action },
        'my_customer',
        device.deviceId
      );
      return makeResult(e, { deviceId: device.deviceId, serial: params.serial, action: params.action });
    } catch (error) {
      return makeErrorMessage(e, {
        detail: `Error performing ${params.action}`,
        errorMessage: error.message || String(error),
        errorStack: error.stack || null
      });
    }
  } else {
    // Error if no mode= provided
    return makeErrorMessage(e, {
      detail: 'Unknown mode: expected mode="serial", mode="user", or mode="action"'
    });
  }
}




function cbBySerial (id) {
  let resp = AdminDirectory.Chromeosdevices.list("my_customer",{query:`id:"${id.toLowerCase()}"`});
  if (resp && resp.chromeosdevices.length) {
    if (resp.chromeosdevices.length > 1) {
      console.warn('Strange: we got more than one hit for a serial number???',id,resp.chromeosdevices.length,resp.chromeosdevices);
    }
    return resp.chromeosdevices[0];
  }  
}


function cbByUser(user) {
  let devicesIterable = AdminDirectory.Chromeosdevices.list(
    "my_customer",
    {query:`recent_user:"${user}"`}
  );
  return devicesIterable.chromeosdevices;
}

function testCbBySerial () {
  let id = "5CD042L0ZS";
  console.log('Testing CB by Serial with',id);
  console.log(cbBySerial(id));
}

function testDisable () {
  let serial = "5CD119166D"; // ACTIVE device
  console.log('Looking up device by serial:', serial);
  const device = cbBySerial(serial);
  console.log('Found device:', device && device.deviceId, 'status:', device && device.status);
  console.log('Attempting disable...');
  AdminDirectory.Chromeosdevices.action(
    { action: 'disable' },
    'my_customer',
    device.deviceId
  );
  console.log('Done — checking new status:');
  console.log(cbBySerial(serial).status);
}

function testReenable () {
  let serial = "5CD119166D"; // should be DISABLED after testDisable
  console.log('Looking up device by serial:', serial);
  const device = cbBySerial(serial);
  console.log('Found device:', device && device.deviceId, 'status:', device && device.status);
  console.log('Attempting reenable...');
  AdminDirectory.Chromeosdevices.action(
    { action: 'reenable' },
    'my_customer',
    device.deviceId
  );
  console.log('Done — checking new status:');
  console.log(cbBySerial(serial).status);
}


function testCbByUser () {
  let student = 'sophia.martinez@innovationcharter.org';
  console.log('Testing cbByUser with ',student)
  console.log(cbByUser(student));
}



var FIRST_NAME_COLUMN_INDEX = 5;
var LAST_NAME_COLUMN_INDEX = 4; 
var MIDDLE_NAME_COLUMN_INDEX = 6;
var COUNTRY_COLUMN_INDEX = 8;

var DETENTION_CENTER_COLUMN_INDEX = 10;
var DETENTION_CENTER_STATE_COLUMN_INDEX = 11;
var NOTES_COLUMN_INDEX = 12;

function searchIceLocator() {
  var range = SpreadsheetApp.getActiveRange();
  var activeSheet = SpreadsheetApp.getActiveSheet()
  var currentRow = range.getRow()
  
  var firstName = activeSheet.getRange(currentRow, FIRST_NAME_COLUMN_INDEX).getValue()
  var middleName = activeSheet.getRange(currentRow, MIDDLE_NAME_COLUMN_INDEX).getValue()
  
  var lastName = activeSheet.getRange(currentRow, LAST_NAME_COLUMN_INDEX).getValue()
  
  var country = activeSheet.getRange(currentRow, COUNTRY_COLUMN_INDEX).getValue()
  var countryCode = lookupCountryCode(country)
  
  var jsonResponse = performLookup(firstName, lastName, countryCode)
  
  var resultCount = jsonResponse.result.length
  if (resultCount > 0) {
    
      applyFoundResult(activeSheet, jsonResponse, 'Found via (' + firstName + ') (' + lastName +')');
    
  } else {
    var jsonResponse = performLookup(firstName.trim() + ' ' + middleName.trim(), lastName.trim(), countryCode)
    resultCount = jsonResponse.result.length;
    if (resultCount > 0) {
      applyFoundResult(activeSheet, jsonResponse, 'Found via (' + firstName + ' ' + middleName + ') (' + lastName +')');
    } else {
          activeSheet.getRange(currentRow, NOTES_COLUMN_INDEX).setValue("No results found via (First) (Last) Name, or (First Middle) (Last) Name");
    }
    
  }
}

function lookupCountryCode(countryName) {
  var response = UrlFetchApp.fetch('https://locator.ice.gov/odls/assets/i18n/en-lang.json')
  var jsonResponse = JSON.parse(response.getContentText())
  var keys = Object.keys(jsonResponse)
  var countryCode
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = jsonResponse[key];
    var regex = new RegExp(countryName, 'i')
    
    if (regex.test(value)) {    
      countryCode = key;
      break;
    }
  }
 return countryCode
}

function performLookup(firstName, lastName, countryCode) {
  var formData = {
    'first_name': firstName,
    'last_name': lastName,
    'country': countryCode
  };

  var options = {
    'method' : 'post',
    'payload' : formData
  };
  var response = UrlFetchApp.fetch('https://locator.ice.gov/odls/api/bio', options);
  var responseText = response.getContentText()
  var jsonResponse = JSON.parse(responseText)
  return jsonResponse
}
function applyFoundResult(activeSheet, jsonResponse, note) {
    if (typeof(note) === 'undefined') {
      note = ''
    }
    var firstResult = jsonResponse.result[0]

    var detentionCenter = firstResult.current_detention_location.name
    var detentionCenterState = firstResult.state_code
    var birthYears = jsonResponse.result.map(function(result) { return result.birth_year }).join(',')
    
    activeSheet.getRange(currentRow, DETENTION_CENTER_COLUMN_INDEX).setValue(detentionCenter);
    activeSheet.getRange(currentRow, DETENTION_CENTER_STATE_COLUMN_INDEX).setValue(detentionCenter);
    activeSheet.getRange(currentRow, NOTES_COLUMN_INDEX).setValue("Found " + resultCount + " results. Birthyears " + birthYears + ". " + note);
}


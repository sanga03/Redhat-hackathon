//window.onload = callDownStream;
var config = {
  providerID: "IBM",
  client_id: "",
  redirect_uri: " ",
  authorization: "",
  scopes: {
    request: ["openid"]
  },
  response_type: 'id_token token',
  nonce: new Date().getTime(),
  debug: true,
  presenttoken: "qs"
};

var jso = new JSO(config);
/* alert("jso is"+jso); */
JSO.enablejQuery($);
jso.on('redirect', function (url) {
  if (jso.URLcontainsToken(window.location.toString())) {
    /* sessionStorage.clear(); */
    $("#responseToken").val('');
    // alert('I just got the token'); //fifth call
    jso.callback(window.location.toString(), config.providerID);
  } else {
    // alert(" I am in the index page and redirecting to URL: "+url); //first call
    window.location = url;
  }
});

jso.on('callback', function (url) {
  //alert('Here I go... I am in callback'); 
});


jso.getToken(function (token) {
  // alert('cleaned callback action and callback page, as I already have token...:'); //subsequently after authenticated when pageis loaded


}, {});

//alert('executed script!!')

function callDownStream() {
  //  alert("callDownStream is called successfully"); //fourth call and after authentication second call
  jso.getToken(function (token) {
    //alert("I got the token..."+ token); //second call
    var base64Url = token.id_token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    var jsonData = JSON.parse(window.atob(base64));
    /* alert(jsonData); */
    var email = jsonData['emailAddress'];
    /* alert(email); */
    var firstName = jsonData['firstName'];
    /* alert(firstName); */
    var lastName = jsonData['lastName'];
    /* alert(lastName); */
    //$("#userName").val(email);
    //$("#fName").val(firstName);
    //$("#lName").val(lastName);
    /* checkNetworkStatus(email); */
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("fName", firstName);
    sessionStorage.setItem("lName", lastName);
  });

}


function getUserData(tokenRet) {
  //alert('hi'); //third call
  console.log("getUserData:" + $("#responseToken").val());
  //tokenRet = $("#responseToken").val();
  if ($("#responseToken").val() != '') {
    var base64Url = tokenRet.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    var jsonData = JSON.parse(window.atob(base64));
    /*  alert(jsonData); */
    var email = jsonData['emailAddress'];
    /*  alert(email); */
    var firstName = jsonData['firstName'];
    var lastName = jsonData['lastName'];
    //$("#userName").val(email);
    //$("#fName").val(firstName);
    //$("#lName").val(lastName);
    /* alert(email);
    alert(firstName);
    alert(lastName); */
    /* sessionStorage.clear(); */
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("fName", firstName);
    sessionStorage.setItem("lName", lastName);
  }
}

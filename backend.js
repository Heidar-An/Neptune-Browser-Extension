// When window has been opened, load all the passwords stored and put them into password table.
window.addEventListener("load", async function() {
    await loadPasswords();
    checkAccountPasswordInput();
});

/**
 * loads all the passwords and puts them into a table
 * @return {Promise} Promise returned from async function
 */
async function loadPasswords(){         
    document.getElementById("passwordTable").innerHTML = "";

    chrome.storage.sync.get(null, function(items) {
        var allKeys = Object.keys(items);
        
        var table = document.getElementById("passwordTable");
        var header = table.createTHead();
        /* 
           for each key in the table, add the password name 
           and a button with an event listener to retrieve the password
        */
        for(var i = 0; i < allKeys.length; i++){
            var passwordName = allKeys[i]; 
            var passwordRow = header.insertRow(i);
            var cellTwo = passwordRow.insertCell(0);
            var cell = passwordRow.insertCell(1);
            cellTwo.innerHTML = "<p1 id=passwordNameCol>" + passwordName + "</p1>";

            var buttonCreate = document.createElement("BUTTON");
            buttonCreate.className = "copyPassword";
            buttonCreate.addEventListener("click", copyButtonClick);
            buttonCreate.innerHTML = "Copy " + '"'+ passwordName + '"';
            cell.appendChild(buttonCreate);
        }
    });
}

/**
 * Checks if an account already has a password
 */
function checkAccountPasswordInput(){          
    chrome.storage.sync.get("accountPassword", function(data){
        if(typeof data.accountPassword != "undefined"){
            // if there is a password saved then make the password setter go away
            document.getElementById("accountPassword").style.display = "none";
            document.getElementById("setAccountPassword").style.display = "none";
        }else{
            // if no password, hide the (empty) password table
            document.getElementById("passwordTable").style.display = "none";
            document.getElementById("").style.display = "none";
        }
    })
}

/**
 * Event listener to check if set account password button has been clicked
 */
document.getElementById("setAccountPassword").addEventListener("click", async function() {
    var accountPasswordInput = document.getElementById("accountPassword");
    var accountPassword = accountPasswordInput.value;
    if (accountPassword != ""){
        accountPasswordInput.style.display = "none";
        document.getElementById("setAccountPassword").style.display = "none";
        hashVal = await sha256(accountPassword);      
        chrome.storage.sync.set({"accountPassword": hashVal}, function(){
            console.log("Set Password.");
        })
    }
});

/**
 * function to hash message with SHA-256
 * @param {String} message 
 * @returns {Promise} Returns promise from async function
 * @returns {String} The hashed value of the message in hexadecimal
 */
async function sha256(message) {
    // encode as UTF-8 
    const msgBuffer = new TextEncoder().encode(message);                   

    // hash the message          
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer); 

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));            

    // convert bytes to hex string   
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    console.log(hashHex) 
    return hashHex;
}

// when the copy button for a password saved is clicked, the password has to be retrieved and copied
// to the user's clipboard
function copyButtonClick(){
    var buttonString = this.innerHTML;
    var indices = [];
    for(var i = 0; i< buttonString.length;i++) {
        if(buttonString[i] === '"'){
            indices.push(i);
        }
    }
    if(indices.length === 2){
        var passwordName = buttonString.slice(indices[0] + 1, indices[1]);
        console.log(passwordName);
        chrome.storage.sync.get(null, function(items){
            var allKeys = Object.keys(items);
            
            for(var i = 0; i < allKeys.length; i++){
                var passwordNameKey = allKeys[i];
                if(passwordNameKey === passwordName){
                    var password = items[passwordNameKey][0];
                    console.log(password);
                    placeholder = document.getElementById("passwordPlaceholder");
                    placeholder.value = password;
                    var copyText = document.getElementById("passwordPlaceholder");
                    copyText.select();
                    document.execCommand("copy");
                    copyText.value = "";
                    break;
                }
            }
        });
    }
}

/**
 * Event listener to check if generate password button has been clicked
 * Generates a password and then saves it to the user's clipboard
 */
document.getElementById("generate").addEventListener("click", function() {
    document.getElementById("passwordName").value = "";
    var characters = ["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%.,/£*&<>?!"]

    // The amount of letters are between 10 and 14 characters
    var amount = Math.floor(((Math.random() * 101) / 7) + 10);
    var password = "";

    //add random letters from the characters array
    for(var i = 0; i < amount; i++){
        var letterPosition = Math.floor(Math.random() * characters[0].length);
        password = password + characters[0].substring(letterPosition, letterPosition + 1);
    }

    //change the value of an empty p1 tag to the password
    placeholder = document.getElementById("passwordPlaceholder");
    placeholder.value = password;
    var copyText = document.getElementById("passwordPlaceholder");
    copyText.select();
    document.execCommand("copy");
    copyTextPopup("popUpCopy");
});

/**
 * used to make "copied!" popup show up for exactly 3 seconds
 * @param {string} popupId 
 */
function copyTextPopup(popupId){
    console.log("copy text popup function is being called");
    popup = document.getElementById(popupId);
    console.log(popup + "= popup")
    popup.style.display = "block";
    setTimeout(function() {
        popup.style.display = "none";
    }, 3000);
}

/**
 * Event listener for save button, if pressed, store the name and password to memory
 */
document.getElementById("savePassword").addEventListener("click", function() {
    var passwordName = document.getElementById("passwordName").value;
    var password = document.getElementById("passwordPlaceholder").value;
    console.log(passwordName);
    console.log(password);
    document.getElementById("passwordPlaceholder").value = "";
    document.getElementById("passwordName").value = "";
    chrome.storage.sync.set({[passwordName]: [password]}, function(){
        console.log("password has been set to " + passwordName);
    });
    loadPasswords();
});

/**
 * Event listener for delete button, if pressed, clear all password from memory
 */
document.getElementById("deleteButton").addEventListener("click", function(){
    chrome.storage.sync.clear();
    loadPasswords();
});


var bTimerStarted = false;
var bTimerOn = false;
var cnt = 0;
var color = 1;
var fName = "";
var lName = "";
var name = "";
var nice = true;
var bGood = true;
var bBadLastYear = false;
var bSmellLikeButt = false;
var myTimer;
var myClearButtonClickTimer;
var clearColor;
var cntClearButtonColorChange;

window.onload = function () {

    clearColor = "red";

    document.getElementById("button").addEventListener("click", buttonClick);
    document.getElementById("clear").addEventListener("click", clearClick);
    document.getElementById("clearButton").addEventListener("click", clearButtonClick);

    var searchBLock = document.getElementById("searchBlock").classList.remove("green");
    document.getElementById("searching").innerHTML = "";
    document.getElementById("progress").innerHTML = "";
}

function buttonClick() {
    clearText();
    clearVars();

    nice = true;
    bGood = true;
    bBadLastYear = false;
    fName = "";
    lName = "";
    name = "";

    var firstName = document.getElementById("first_name");
    var lastName = document.getElementById("last_name");

    fName = firstName.value;
    lName = lastName.value;

    if (fName.length < 1) {
        alert("Please enter a first name");
        bGood = false;
    } else if (lName.length < 1) {
        alert("Please enter a last name");
        bGood = false;
    } else {
        bGood = true;
    }

    if (fName.toUpperCase() == "CARLEE") {
        nice = true;
    } else if (fName.toUpperCase() == "SCOTT") {
        nice = true;
        bBadLastYear = true;
    } else if (fName.toUpperCase() == "DAVID") {
        nice = true;
        bSmellLikeButt = true;
    } else if (fName.toUpperCase() == "JAMES") {
        nice = false;
        if (lName.toUpperCase() != "KING") {
            nice = true;
        }
    } else if (fName.toUpperCase() == "BUD") {
        nice = false;
    } else if (fName.toUpperCase() == "JOSH") {
        nice = false;
    } else if (fName.toUpperCase() == "CHRISTIAN") {
        nice = false;
    } else if (fName.toUpperCase() == "AUSTIN") {
        nice = false;
    } else if (fName.toUpperCase() == "AVA") {
        nice = true
    } else {
        nice = true;
    }

    if (bGood == true) {
        name = firstName.value + " " + lastName.value;
        myTimer = setInterval(tick, 1000);
    }

}

function tick() {

    if (cnt == 0) {

        document.getElementById("searching").innerHTML = "Please wait while we search Santa's Database for ";
        document.getElementById("searching2").innerHTML = name;
        color = 2;
    }

    if (cnt > 6) {
        clearInterval(myTimer);
        displayResults();
    }

    if (color == 1) {
        document.getElementById("searchBlock").classList.remove("green");
        document.getElementById("searchBlock").classList.add("red");
        color = 2;
    } else if (color == 2) {
        document.getElementById("searchBlock").classList.remove("red");
        document.getElementById("searchBlock").classList.add("green");
        color = 1;
    }

    document.getElementById("progress").innerHTML = document.getElementById("progress").innerHTML + " .";

    cnt++;
}

function displayResults() {
    document.getElementById("progress").innerHTML = "";

    document.getElementById("searchBlock").classList.remove("green");
    document.getElementById("searchBlock").classList.remove("red");

    if (nice == false) {
        document.getElementById("searching").innerHTML = "Our results show that " + name + " is on the";
        document.getElementById("searching2").innerHTML = "Naughty List!";
        document.getElementById("message1").innerHTML = "Sorry.";
        document.getElementById("message").innerHTML = "Please try better next year. Santa wishes you the best!";
        document.getElementById("searchBlock").classList.add("red");
        if (fName.toUpperCase() == "CHRISTIAN") {
            document.getElementById("message").innerHTML = "You said 25 cus words and showed your butt to a stranger. You are on the automatic naughty list for 2 years!";
        }
        if (fName.toUpperCase() == "AUSTIN") {
            document.getElementById("message").innerHTML = "Your are naughty like snot stupid booger. You get coal!";
        }
        if (fName.toUpperCase() == "JAMES") {
            document.getElementById("message").innerHTML = "You are on the naughty list you fucking asshole!!";
        }
    } else {
        document.getElementById("searching").innerHTML = "Our results show that " + name + " is on the";
        document.getElementById("searching2").innerHTML = "Nice List!";
        document.getElementById("message1").innerHTML = "Congragulations! ";
        if (bBadLastYear == true) {
            document.getElementById("message").innerHTML = "Your were on the naughty list last year but did better this year! Keep up the good work!";
        } else if (bSmellLikeButt == true) {
            document.getElementById("message").innerHTML = "You smell like dog butt. Keep up the good work!";
        }else {
            document.getElementById("message").innerHTML = "Keep up the good work!";
        }

        if (fName.toUpperCase() == "AVA") {
            document.getElementById("message").innerHTML = "You are on the nice list for EVER. For INIFINITI years. And you are invited to Buddy the Elf's Birthday! Good Job.";
        }



        if (fName.toUpperCase() == "CAROL") {
            document.getElementById("message").innerHTML = "Your good deeds and gluten free cookies have gotten you on the nice list until 2025. Good job!";
        }

        if (fName.toUpperCase() == "LAYLA") {
            document.getElementById("message").innerHTML = "Your too cool for the naughty list. Stay cool !!!";
        }
        document.getElementById("searchBlock").classList.add("green");
    }

    if (nice == true) {
        document.getElementById("searchBlock").classList.add("green");
    } else if (nice == false) {
        document.getElementById("searchBlock").classList.add("red");
    }

    document.getElementById("searchBlock").classList.add("green");

}

function clearClick() {
    clearText();
    clearVars();

    document.getElementById("first_name").value = "";
    document.getElementById("last_name").value = "";




}

function clearText() {
    document.getElementById("searching").innerHTML = "";
    document.getElementById("message").innerHTML = "";
    document.getElementById("searchBlock").classList.remove("green");
    document.getElementById("searchBlock").classList.remove("red");
    document.getElementById("progress").innerHTML = "";
    document.getElementById("message1").innerHTML = "";

}

function clearVars() {
    cnt = 0;
    color = 2;
    fName = "";
    lName = "";
    name = "";
    nice = true;
    bGood = true;
    bBadLastYear = false;
    cntClearButtonColorChange = 0;
}

function clearButtonClick() {

    cntClearButtonColorChange = 0;

    if (document.getElementById("clearButton").classList.contains("red")) {
        
         document.getElementById("clearButton").classList.remove("red");
        document.getElementById("clearButton").classList.add("green");        
        myClearButtonClickTimer = setInterval(clearButtonColorChange, 500)

    }



}

function clearButtonColorChange() {
    if (cntClearButtonColorChange == 0) {
        document.getElementById("clearButton").classList.remove("green");
        document.getElementById("clearButton").classList.add("red");
        clearInterval(myClearButtonClickTimer);
    }

    cntClearButtonColorChange++;

}

//newsletter
const isEmail = (email) =>
	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
		email
	);
function getemail() {
	return document.querySelector("#footeremail").value;
}
//requires
//onsubmit="return false;"
function subscribe(btn) {
	const ad = getemail();
	if (!isEmail(ad)) return;
	//send ad
}
function unsubscribe(btn) {
	const ad = getemail();
	if (!isEmail(ad)) return;
	//send ad
}

//videos
function focusVid(index) {
	const el = Array.prototype.slice.call(
		document.querySelectorAll(".vids li")
	)[index];
	if (document.querySelector(".activeVid"))
		document.querySelector(".activeVid").classList.remove("activeVid");

	el.classList.add("activeVid");
	console.log(index);
}
function checkYoutubeClick(tar) {
	if (
		tar.parentNode.parentNode.classList &&
		tar.parentNode.parentNode.classList.contains("labels")
	) {
		if (document.querySelector(".activeLabel"))
			document
				.querySelector(".activeLabel")
				.classList.remove("activeLabel");
		tar.classList.add("activeLabel");
		focusVid(tar.id);
	}
	if (tar.classList.contains("youtubePreviewMode")) {
		//is either clicking on prevMiewode   .vid   OR   a vid's   .labels li
		tar.classList.remove("youtubePreviewMode");
	}
}

//popups
let popupClicked; //boolean, default:  false
function popup() {
	return document.querySelector(".popup");
}
function popupConditionsMet(e) {
	const tar = (e && e.target) || e;
	if (!e || !tar || !tar.classList) return false;
	if (tar.classList.contains("popupLink") || tar.classList.contains("popup"))
		return true;
	return popupConditionsMet(tar.parentNode);
}
function clickPopupLabel() {
	popupClicked = true;
}

//init
let lastTarget;
let didScroll;
let startScrollY1 = 0;
let startScrollY2 = 0;
window.onload = function (e) {
	//listen to events

	//click
	window.addEventListener("click", function (e) {
		//youtube vids
		checkYoutubeClick(e.target);
		popupClicked = false;
	});

	//touch
	window.addEventListener("touchstart", function (e) {
		startScrollY1 = window.scrollY;
		startScrollY2 = document.querySelector(".changelog").scrollTop;
	});
	window.addEventListener("touchmove", function (e) {
		if (
			window.scrollY !== startScrollY1 ||
			document.querySelector(".changelog").scrollY !== startScrollY2
		)
			didScroll = true;
		startScrollY1 = window.scrollY;
		startScrollY2 = document.querySelector(".changelog").scrollTop;
		lastTarget = e.target;
	});
	window.addEventListener("touchend", function (e) {
		if (!didScroll) {
			checkYoutubeClick(e.target);
			showingPopup = false;
			popup().classList.remove("showing");
		}
		didScroll = false;
		startScrollY2 = 0;
		startScrollY1 = 0;
	});

	//mousemove
	//popups / tooltip
	let showingPopup;
	window.addEventListener("mousemove", function (e) {
		if (popupConditionsMet(e)) {
			if (!showingPopup) {
				popup().classList.add("showing");
				showingPopup = true;
			}
			if (!popupClicked) {
				const x = e.pageX - popup().offsetWidth / 2,
					y = e.pageY - popup().offsetHeight - 1;
				popup().style.top = y + "px";
				popup().style.left = (x < 0 ? 0 : x) + "px";
			}
		} else {
			if (showingPopup) {
				popup().classList.remove("showing");
				showingPopup = false;
			}
		}
	});
};

function addCurrentReleaseLabel() {
	const currentRelease = document.createElement("strong");
	currentRelease.style.background = "rgb(83,158,219)";
	currentRelease.appendChild(document.createTextNode("(current release)"));
	const releaseHeader = document.querySelector(".changelog ul h7");
	releaseHeader.appendChild(document.createTextNode("\u00A0"));
	releaseHeader.appendChild(currentRelease);
}

//removes (2nd Changelog entry) (so ppl don't see too many updates too close together) (looks unprofessional)
setTimeout(function () {
	document.querySelectorAll(".changelog ul")[0].parentNode.remove();
	document.querySelectorAll("a")[1].innerHTML =
		"https://github.com/steventheworker/Dock-Expos--home/releases/download/v2.2/DockExposev2.2.zip";
	document.querySelectorAll(".changelog a")[0].href =
		"https://github.com/steventheworker/Dock-Expos--home/releases/download/v2.3/DockExposev2.3.zip";
	addCurrentReleaseLabel();
});

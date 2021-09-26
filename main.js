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
  const el = Array.prototype.slice.call(document.querySelectorAll(".vids li"))[
    index
  ];
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
      document.querySelector(".activeLabel").classList.remove("activeLabel");
    tar.classList.add("activeLabel");
    focusVid(tar.id);
  }
  if (tar.classList.contains("youtubePreviewMode")) {
    //is either clicking on prevMiewode   .vid   OR   a vid's   .labels li
    if (document.querySelector(".youtubePreviewMode"))
      return document
        .querySelector(".youtubePreviewMode")
        .classList.remove("youtubePreviewMode");
  }
}

//popups
let popupClicked; //boolean, default:  false
function popup() {
  return document.querySelector(".popup");
}
function popupConditionsMet(e) {
  const tar = e.target;
  const par = e.target.parentNode,
    parpar = par.parentNode,
    parparpar = parpar && parpar.parentNode;
  return (
    tar.classList.contains("popupLink") ||
    tar.classList.contains("popup") ||
    (par && parpar && parpar.classList && parpar.classList.contains("popup")) ||
    (par &&
      parpar &&
      parparpar &&
      parparpar.classList &&
      parparpar.classList.contains("popup"))
  );
}
function clickPopupLabel() {
  popupClicked = true;
}

//init
window.onload = function (e) {
  //listen to events

  //click
  window.addEventListener("click", function (e) {
    //youtube vids
    checkYoutubeClick(e.target);
    popupClicked = false;
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

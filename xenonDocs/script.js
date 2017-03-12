/* Page Related Function */
pageList = [];

function pageAdd() {
  // -- This function simply populates the sidebar with pages.
  var pageListDOM = document.getElementsByClassName("sidebar")[0];
  pageListDOM.size = pageList.length;
  for(var i = 0; i < pageList.length; i++) {
    var pageOption = document.createElement("option");
    pageOption.text = pageList[i].pageName;
    pageOption.value = pageList[i].pageURL;
    pageListDOM.add(pageOption);
  }
}

function pageCreate(name, url) {
  // -- This function is very hacky!
  if (location.pathname.includes("/pages/") === true) {
    pageList.push({pageName: name, pageURL: "../" + url});
  } else {
    pageList.push({pageName: name, pageURL: url});
  }
}
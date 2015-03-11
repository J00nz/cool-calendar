function StartAnimateZoom(vt) {
    var trans = vt % 100;
    var prv = vt - trans;
    Lastfrm = new Date().getTime();
    if (trans != 0) {
        if (trans > 50) {
            AnimateToNext((prv) + 100);
        } else {
            AnimateToLast(prv);
        }
    }
}

var NxtAnim = null,
Lastfrm = null, delta = 0,
aniType = 0, finalStep = 0;

function AnimateToNext(to) {
    finalStep = to;

    Lastfrm = new Date();

    aniType = 1;

    isAnimating = true;

    ZoomAnimate();
}

function AnimateToLast(to) {
    finalStep = to;

    Lastfrm = new Date();

    aniType = -1;

    isAnimating = true;

    ZoomAnimate();
}

function ZoomAnimate() {
    if (!isAnimating || isZooming) { aniType = 0; }

    var nxtfrm = new Date(),
    delta = nxtfrm - Lastfrm;

    switch (true) {
        case (aniType > 0):
            viewTime += (delta * 0.5);
            if (viewTime > finalStep) {
                viewTime = finalStep;
                aniType = 0;
            }
            break;
        case (aniType < 0):
            viewTime -= (delta * 0.5);
            if (viewTime < finalStep) {
                viewTime = finalStep;
                aniType = 0;
            }
            break;
        default:
            isAnimating = false;
            DrawCalendar();
            return;
    }
    DrawCalendar();

    Lastfrm = nxtfrm;

    window.requestAnimFrame(ZoomAnimate);
}



//----------- Old Inlined stuff.... -----------//

selectedTime = new Date();

var mouseDown = false,
        FirstClickX = 0,
        FirstClickY = 0,
        clicked = null,
        canvasOffsetTop = 0,
        canvasOffsetLeft = 0;

$(document).ready(function () {
    dayNumColor = "rgb(255,255,255)";

    canvas = $('.calendarCanvas')[0];

    InitiateTestData();

    var actData = $("#jsActs").val();

    //Acts = JSON.parse(actData);

    $(canvas).bind("mousedown", CanvasMouseDown);
    $(canvas).bind("mousemove", CanvasMouseMove);
    $(canvas).bind('mouseup', CanvasMouseEnd);
    
    $(canvas).bind('touchstart', CanvasTouchStart);
    $(canvas).bind('touchmove', CanvasTouchMove);
    $(canvas).bind('touchend', CanvasTouchEnd);

    document.body.onmouseout = CanvasMouseOut;

    OnComplete();

    document.addEventListener('touchstart', function(event){
       event.preventDefault();
    });
});

function OnComplete() {
    //CaluculateAndSetFrameHeight();

    UpdateCanvasHeights();
    UpdateSelectedTime(selectedTime);
    InitiateCalendar();
    $(window).resize(function () {
        InitiateCalendar();
    });

    var CanOffset = findPos(canvas);
    canvasOffsetLeft = CanOffset[0];
    canvasOffsetTop = CanOffset[1];
}

function UpdateSelectedTime(newTime) {
    selectedTime = newTime;

    var tmpMonStart = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), 1);

    daysInSelectedMonth = (new Date(selectedTime.getFullYear(), selectedTime.getMonth() + 1, 0)).getDate();
    startDayOfWeek = tmpMonStart.getDay();
    if (startDayOfWeek == 0) { startDayOfWeek = 7; }

    weeksInSelectedMonth = Math.ceil((daysInSelectedMonth + startDayOfWeek - 1) / 7);

    selectedDate = selectedTime.getDate();

    selectedWeekday = selectedTime.getDay();

    if (selectedWeekday == 0) { selectedWeekday = 7; }

    monthMinuteOffset = (tmpMonStart.getTime() - offsetMilisecs) / 60000;

    var tmpDate = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), selectedDate - selectedWeekday + 1);

    weekMinuteOffset = ((tmpDate.getTime() - offsetMilisecs) / 60000);

    tmpDate = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), selectedDate);
    dayMinuteOffset = ((tmpDate.getTime() - offsetMilisecs) / 60000);

    startDayOfWeek--;

    SortActs();
}

$(document).keydown(function (e) {
    var sTime = selectedTime, updated = false;
    if (e.keyCode == 40) {
        viewTime -= 10;
        updated = true;
    } else if (e.keyCode == 39) {
        if (viewTime >= month && viewTime < week) {
            sTime.setMonth(sTime.getMonth() + 1);
        } else if (viewTime >= week) {
            sTime.setDate(sTime.getDate() + 7);
        }
        updated = true;
    } else if (e.keyCode == 38) {
        viewTime += 10;
        updated = true;
    } else if (e.keyCode == 37) {
        if (viewTime >= month && viewTime < week) {
            sTime.setMonth(sTime.getMonth() - 1);
        } else if (viewTime >= week) {
            sTime.setDate(sTime.getDate() - 7);
        }
        updated = true;
    }
    if (updated) {
        UpdateSelectedTime(sTime);
        UpdateCanvasHeights();
        DrawCalendar();
    }
});

clickArr = [];

var CanvasMouseDown = function (e) {
    selectX = e.pageX,
            selectY = e.pageY,
            FirstClickX = selectX,
            FirstClickY = selectY,
            LastX = selectX,
            LastY = selectY,
            mouseDown = true,
            TotalmoveX = 0;
    TotalmoveY = 0;
    Totalmove = 0;

    clicked = GetActivityInside(selectX, selectY);

    clickArr = GetActivitysInside(selectX, selectY);

    //clicked.Click();

    e.preventDefault && e.preventDefault();
}
var Totalmove = 0, TotalmoveX = 0, TotalmoveY = 0;
var LastX = 0, LastY = 0;
var CanvasMouseMove = function (e) {
    selectX = e.pageX - canvasOffsetLeft,
            selectY = e.pageY - canvasOffsetTop,
            moveX = selectX - LastX,
            moveY = selectY - LastY;

    TotalmoveX += -moveX > 0 ? -moveX : moveX;
    TotalmoveY += -moveY > 0 ? -moveY : moveY;
    Totalmove = TotalmoveX + TotalmoveY;

    if (mouseDown) {
        if (TotalmoveX > 5 && TotalmoveX > TotalmoveY) {
            viewTime += (moveX / 2);
            if (viewTime < 0) { viewTime = 0; }
            if (viewTime > maxZoom) { viewTime = maxZoom; }
            if (viewTime < day) { topMinuteOffset = 0; }
            DrawCalendar();
            isZooming = true;
        } else if (TotalmoveY > 5 && TotalmoveY > TotalmoveX) {
            if (viewTime >= day) {
                topMinuteOffset -= (moveY / minInc);
                if (topMinuteOffset < 0) { topMinuteOffset = 0; }
                var tmpHgt = (canvasHeight - 60) / minInc;
                if ((topMinuteOffset + tmpHgt) > 1440) { topMinuteOffset = 1440 - tmpHgt; }
                DrawCalendar();
            }
        }
    }

    LastX = selectX,
            LastY = selectY;
}
var isDbl = false, dblScrpt;
var CanvasMouseEnd = function (e) {
    mouseDown = false;

    isZooming = false;

    if (isDbl) {
        isDbl = false;
        clearTimeout(dblScrpt);
        var nxt;
        var tmpDelta = viewTime - (viewTime % 100);

        if (selectY < topOfst) {
                nxt = tmpDelta - 100;
                if (nxt < 0) { nxt = 0; }
                AnimateToLast(nxt);
        } else {
                var nxt = tmpDelta + 100;
                if (nxt > maxZoom) { nxt = maxZoom; }
                AnimateToNext(nxt);
        }
    } else {
        isDbl = true;
        clearTimeout(dblScrpt);
        if (viewTime < day) {
            StartAnimateZoom(viewTime);
        }
        dblScrpt = setTimeout("isDbl = false;", 300);
    }


    if (Totalmove < 5) {
        //                if (clicked != null) {
        //                    clicked.Click(e);
        //                }
        if (clickArr.length > 0) {
            for (var i = clickArr.length - 1; i >= 0; i--) {
                clickArr[i].Click(e);
            }
        }
    }
    DrawCalendar();
}

var CanvasMouseOut = function (e) {
    mouseDown = false;

    isDbl = false;

    clearTimeout(dblScrpt);

    if (isZooming) {
        isZooming = false;
        var nxt;
        if (selectX > FirstClickX) {
            nxt = viewTime - (viewTime % 100) + 100;
            if (nxt > maxZoom) {
                nxt = maxZoom;
            }
            AnimateToNext(nxt);
        } else {
            nxt = viewTime - (viewTime % 100);
            AnimateToLast(nxt);
        }
    }

    DrawCalendar();
}

var CanvasTouchStart = function (e) {

    if (window.navigator.msPointerEnabled) {
        touch = e;
    } else {
        touch = e.originalEvent.touches[0];
    }
    lastPinchWidth = -1;
    
    CanvasMouseDown(touch);

    return touch;
};

var wasMulti = false;

var CanvasTouchMove = function (event) {
    if (event.originalEvent.touches.length === 1) {
        CanvasMouseMove(event.originalEvent.touches[0]);
    } else if (event.originalEvent.touches.length > 1) {
        wasMulti = true;
        var newX1 = event.originalEvent.touches[0].pageX, newY1 = event.originalEvent.touches[0].pageY, newX2 = event.originalEvent.touches[1].pageX, newY2 = event.originalEvent.touches[1].pageY;
        var newPinchWidth = Math.sqrt(Math.pow(newX2 - newX1, 2) + Math.pow(newY2 - newY1, 2));
        //var middleX = ((newX1 + newX2) / 2) - infoWidth;
        if (lastPinchWidth >= 0) {
            var deltaWidth = newPinchWidth - lastPinchWidth;

            viewTime += (deltaWidth / 2);
            if (viewTime < 0) { viewTime = 0; }
            if (viewTime > maxZoom) { viewTime = maxZoom; }
            if (viewTime < day) { topMinuteOffset = 0; }

            DrawCalendar();
            isZooming = true;
        }

        lastPinchWidth = newPinchWidth;
    }
};

var CanvasTouchEnd = function(e) {
    if (!wasMulti) {
        var evt = e.originalEvent.changedTouches[0];
        CanvasMouseEnd(evt);
    } else {
        wasMulti = false;
    
        mouseDown = false;
        isZooming = false;
    
        if (viewTime < day) {
            StartAnimateZoom(viewTime);
        }
    
        DrawCalendar();
    }
}

var dayClick = function (e) {
    var sTime = selectedTime;
    sTime.setDate(this.arguments[0]);
    sTime.setHours(0);
    sTime.setMinutes(minInc * (selectY - this.y));
    UpdateSelectedTime(sTime);
    DrawCalendar();
}

var actClick = function (e) {
    //alert(this.arguments[0]);
}


function InitiateTestData() {
    Acts = [];
    //6307200
    // 525600

    /*Acts.push(new Act(6407200, 6407320));

    Acts.push(new Act(6507200, 6507320));

    Acts.push(new Act(6607200, 6607320));

    Acts.push(new Act(6707200, 6707320));*/

    var act = new Act(7878000, 7878120);
    act.style = "0,255,0";

    Acts.push(act)
}


function findPos(obj) {
    var curleft = curtop = 0;

    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return [curleft, curtop];
}
    
    
    
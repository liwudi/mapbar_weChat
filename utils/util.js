
let systemInfo = {
    "model":"iPhone 6",
    "pixelRatio":2,
    "windowWidth":320,
    "windowHeight":528,
    "system":"iOS 10.0.1",
    "language":"zh_CN",
    "version":"6.3.9",
    "platform":"devtools"
};

wx.getSystemInfo({
    success: (res) => {
        systemInfo = res;
    }
});

function getNowDate(s = new Date().getTime()) {
    let day = new Date(s);
    let [Year,Month,Day,Hour,Minute,CurrentDate] = [0,0,0,0,0,``]
    //初始化时间
    //Year= day.getYear();//有火狐下2008年显示108的bug
    Year = day.getFullYear();//ie火狐下都可以
    Month = day.getMonth() + 1;
    Day = day.getDate();
    Hour = day.getHours();
    Minute = day.getMinutes();
    // Second = day.getSeconds();
    // CurrentDate += Year + "-";
    if (Month >= 10) {
        CurrentDate += `${Month}-`;
    } else {
        CurrentDate += `0${Month}-`;
    }
    if (Day >= 10) {
        CurrentDate += `${Day}`;
    } else {
        CurrentDate += `0${Day}`;
    }
    if (Hour >= 10) {
        CurrentDate += ` ${Hour}:`;
    } else {
        CurrentDate += ` 0${Hour}:`;
    }
    if (Minute >= 10) {
        CurrentDate += `${Minute}`;
    } else {
        CurrentDate += `0${Minute}`;
    }
    return CurrentDate;
}

module.exports = {
  systemInfo,
  getNowDate,
  
}
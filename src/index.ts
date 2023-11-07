// 获取脚本配置
const { SHOW_CONSOLE } = hamibot.env;

// 等待开启无障碍权限
auto.waitFor();
if (!requestScreenCapture()) {
    toastLog('没有授予 Hamibot 屏幕截图权限');
    hamibot.exit();
}

// 显示控制台
if (SHOW_CONSOLE) {
    console.show();
    sleep(300);
    // 修改控制台位置
    console.setPosition(0, 100);
    // 修改控制台大小
    console.setSize(device.width, device.height / 4);
}

function startApp() {
    // 启动微信
    var startState = launch('com.tencent.mm');
    if (!startState) {
        return false
    }
    // 切换主页面
    while(!click('通讯录'));
    return true;
}

function getOneScreenFriendList() {
    return className('android.widget.TextView').depth(22).find();
}

function checkFriendItem(friendItem: UiObject) {
    var name = friendItem.text();
    console.log('check name: ', name);
    // 进入好友详情页
    while(!click(friendItem.bounds().left, friendItem.bounds().right, friendItem.bounds().top, friendItem.bounds().bottom));
    sleep(500);
    // 进入聊天消息页面
    while(!click('发消息'));
    sleep(500);
    // 更多按钮
    var moreButton = desc('更多功能按钮，已折叠').depth(19).findOne()
    var s = moreButton.click();
    if (!s) {
        return
    }
    sleep(500);
    // 转账按钮
    const transferButton = text('转账').depth(24).findOnce()
    if (!transferButton) {
        return
    }
    click(transferButton.bounds().centerX(), transferButton.bounds().centerY());    
    sleep(500);
    // 输入金额
    const amount = className("android.widget.TextView").text("1").findOne();
    if (!amount) {
        return
    }
    amount.click();
    // 转账确认按钮
    const transferConfirm = className("android.widget.Button").text("转账").findOne()
    if (!transferConfirm) {
        return
    }
    while(!transferConfirm.click())
    // 转账消息
    sleep(5000);
    const _img = captureScreen();
    const msg = ocr.recognizeText(_img);
    parseMsg(msg);
}

function parseMsg(msg: string) {
    // 被拉黑了 or 被删除了
    if (msg.includes('好友关系是否正常') || msg.includes('你不是收款方好友')) {
        var isDel = msg.includes('你不是收款方好友');
        processAbnormalFriends(isDel);
    } else {
        // 退出到聊天页面
        sleep(1000);
        back();
        sleep(500);
        back();
        sleep(500);
        back();
        sleep(500);
        back();
        sleep(500);
        back();
        // 再次进入主页面
        while(!click('通讯录'));
    }
}


function processAbnormalFriends(isDel: boolean) {
    console.log(isDel ? '-> 被删除了' : '-> 被拉黑了');
    sleep(500);
    // 退出到聊天页面
    const b1 = text('我知道了').depth(7).findOnce()
    if (!b1) {
        return
    }
    b1.click();
    sleep(1000);
    back();
    sleep(500);
    back();
    sleep(500);
    // 开始设置备注
    var moreButton = className('android.widget.LinearLayout').depth(11).id("coz").findOne()
    if (!moreButton) {
        return
    }
    click(moreButton.bounds().centerX(), moreButton.bounds().centerY());
    
}

function startCheckFriends() {
    var friends = getOneScreenFriendList();
    for (var i = 0; i < friends.length; i++) {
        checkFriendItem(friends[i]);
        break;
    }
}

function main() {
    var s = startApp();
    if (!s) {
        return
    }
    startCheckFriends();
}

main();

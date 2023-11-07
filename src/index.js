"use strict";
// 获取脚本配置
const { SHOW_CONSOLE } = hamibot.env;
// 等待开启无障碍权限
auto.waitFor();
// 请求截屏权限
if (!requestScreenCapture()) {
    toastLog('没有授予 Hamibot 屏幕截图权限');
    hamibot.exit();
}
// 显示控制台
// if (SHOW_CONSOLE) {
//     console.show();
//     sleep(300);
//     // 修改控制台位置
//     console.setPosition(0, 100);
//     // 修改控制台大小
//     console.setSize(device.width, device.height / 5);
// }
function startApp() {
    // 启动微信
    var startState = launch('com.tencent.mm');
    if (!startState) {
        return false;
    }
    sleep(1000);
    // 切换主页面
    while (!click('通讯录'))
        ;
    return true;
}
function getOneScreenFriendList() {
    return className('android.widget.TextView').depth(22).find();
}
function checkFriendItem(friendItem) {
    var name = friendItem.text();
    console.log('check name: ', name);
    // 进入好友详情页
    click(friendItem.bounds().centerX(), friendItem.bounds().centerY());
    sleep(1000);
    // 进入聊天消息页面
    while (!click('发消息'))
        ;
    sleep(1000);
    // 更多按钮
    var moreButton = desc('更多功能按钮，已折叠').depth(19).findOne();
    while (!moreButton.click())
        ;
    sleep(1000);
    // 转账按钮
    const transferButton = text('转账').depth(24).findOnce();
    if (!transferButton) {
        return;
    }
    click(transferButton.bounds().centerX(), transferButton.bounds().centerY());
    sleep(1000);
    // 输入金额
    const amount = className("android.widget.TextView").text("1").findOne();
    if (!amount) {
        return;
    }
    while (!amount.click())
        ;
    sleep(1000);
    // 转账确认按钮
    const transferConfirm = className("android.widget.Button").depth(14).text("转账").findOne();
    while (!transferConfirm.click())
        ;
    sleep(2000);
    var normalWidget1 = text('选择付款方式').findOnce();
    var normalWidget2 = text('请输入支付密码').findOnce();
    if ((normalWidget1 && normalWidget1.text() === '选择付款方式') || (normalWidget2 && normalWidget2.text() === '请输入支付密码')) {
        console.log('-> 正常关系');
        sleep(1000);
        back();
        sleep(1000);
        back();
        sleep(1000);
        back();
        sleep(1000);
        back();
        sleep(1000);
        back();
        if (normalWidget2 && normalWidget2.text() === '请输入支付密码') {
            sleep(1000);
            back();
        }
        sleep(1000);
        while (!click('通讯录'))
            ;
        return;
    }
    // 转账消息
    const msg = ocr.recognizeText(captureScreen());
    var fState = parseMsg(msg);
    console.log(fState === 'del' ? '-> 被删除了' : '-> 被拉黑了');
    if (fState === 'none') {
        return;
    }
    sleep(1000);
    // 再次进入好友详情页
    click(friendItem.bounds().centerX(), friendItem.bounds().centerY());
    sleep(1000);
    setNote(fState);
}
function parseMsg(msg) {
    var state = 'none';
    // 被拉黑了 or 被删除了
    if (msg.includes('好友关系是否正常') || msg.includes('你不是收款方好友')) {
        var isDel = msg.includes('你不是收款方好友');
        state = isDel ? 'del' : 'blacklist';
        sleep(1000);
        // 退出到聊天页面
        const cBut = className('android.widget.Button').text('我知道了').depth(7).findOnce();
        if (!cBut) {
            return state;
        }
        while (!cBut.click())
            ;
    }
    sleep(1000);
    back();
    sleep(1000);
    back();
    sleep(1000);
    back();
    sleep(1000);
    back();
    sleep(1000);
    // 再次进入主页面
    while (!click('通讯录'))
        ;
    return state;
}
function setNote(state) {
    var noteButtons = className('android.widget.TextView').find();
    for (let i = 0; i < noteButtons.length; i++) {
        var item = noteButtons[i];
        if (item.text().includes('标签')) {
            click(item.bounds().centerX(), item.bounds().centerY());
            break;
        }
    }
    sleep(1000);
    // 进入设置页面
    const addLabelButton = className('android.widget.TextView').text('标签').findOne();
    click(addLabelButton.bounds().centerX() + 100, addLabelButton.bounds().centerY() + 100);
    sleep(1000);
    // 设置标签
    const labelInput = className('android.widget.EditText').text('选择或搜索标签').findOnce();
    if (!labelInput) {
        return;
    }
    const text = state === 'del' ? '已删除' : '已拉黑';
    labelInput.setText(text);
    sleep(1000);
    // 保存标签
    const saveButton = className('android.widget.Button').text('保存').depth(12).findOne();
    while (!saveButton.click())
        ;
    sleep(1000);
    const doneButton = className('android.widget.Button').text('完成').depth(12).findOne();
    if (doneButton.enabled()) {
        while (!doneButton.click())
            ;
        sleep(1000);
        back();
    }
    else {
        back();
        sleep(1000);
        back();
    }
}
function startCheckFriends() {
    var friends = getOneScreenFriendList();
    for (var i = 0; i < friends.length; i++) {
        sleep(1500);
        checkFriendItem(friends[i]);
        sleep(1500);
        break;
    }
}
function main() {
    var s = startApp();
    if (!s) {
        hamibot.exit();
        return;
    }
    sleep(1000);
    startCheckFriends();
    hamibot.exit();
}
main();

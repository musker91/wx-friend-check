"use strict";
// 获取脚本配置
const { SHOW_CONSOLE, SKIP_CHECK_NAMES, ENABLE_STORAGE, CLEAN_STORAGE } = hamibot.env;
// 等待开启无障碍权限
auto.waitFor();
const DB_NAME = 'wx-checked-friends';
const CHECK_KEY = 'checked-friends';
if (CLEAN_STORAGE === 'true') {
    storages.remove(DB_NAME);
}
// 显示控制台
if (SHOW_CONSOLE === 'true') {
    console.show();
    sleep(300);
    // 修改控制台位置
    console.setPosition(0, 100);
    // 修改控制台大小
    console.setSize(device.width, device.height / 4);
}
var skipCheckNameList = ['微信团队', '文件传输助手'];
var allFriendsName = [];
var processFriendsName = [];
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
    sleep(1500);
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
    sleep(3000);
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
        sleep(1000);
        while (!click('通讯录'))
            ;
        return;
    }
    // 转账消息
    var fState = parseMsg();
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
function parseMsg() {
    var state = 'none';
    var msgWidget = className("android.widget.TextView").depth(9).findOnce();
    if (!msgWidget) {
        return state;
    }
    const msg = msgWidget.text();
    // 被拉黑了 or 被删除了
    if (msg.includes('好友关系是否正常') || msg.includes('你不是收款方好友') || msg.includes('无法完成交易')) {
        var isDel = msg.includes('你不是收款方好友') || msg.includes('无法完成交易');
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
function checkIsEnd() {
    var items = className('android.widget.TextView').depth(18).find();
    for (let i = 0; i < items.length; i++) {
        var item = items[i];
        if (item && item.text().includes('个朋友')) {
            return true;
        }
    }
    return false;
}
function checkIsTop() {
    var top = className('android.widget.TextView').depth(21).findOnce();
    if (top && top.text().includes('新的朋友')) {
        return true;
    }
    return false;
}
function startCheckFriends() {
    while (true) {
        var isEnd = checkIsEnd();
        var friends = getOneScreenFriendList();
        var firstFriend = friends[0];
        var lastFriend = friends[friends.length - 1];
        var count = friends.length - (isEnd ? 0 : 1);
        for (var i = 0; i < count; i++) {
            var item = friends[i];
            var name = item.text();
            if (processFriendsName.indexOf(name) >= 0 || skipCheckNameList.indexOf(name) >= 0) {
                continue;
            }
            checkFriendItem(friends[i]);
            processFriendsName.push(name);
            if (ENABLE_STORAGE === 'true') {
                var db = storages.create(DB_NAME);
                db.put(CHECK_KEY, processFriendsName);
            }
            sleep(1500);
        }
        if (isEnd) {
            break;
        }
        swipe(lastFriend.bounds().centerX(), lastFriend.bounds().centerY() * 0.6, firstFriend.bounds().centerX(), firstFriend.bounds().centerY() * 0.4, 1000);
        sleep(1500);
    }
}
function parsePassCheckNames() {
    if (SKIP_CHECK_NAMES) {
        SKIP_CHECK_NAMES.split('|').forEach((item) => {
            if (item) {
                skipCheckNameList.push(item);
            }
        });
    }
    if (ENABLE_STORAGE === 'true') {
        var db = storages.create(DB_NAME);
        var data = db.get(CHECK_KEY, []);
        data.forEach((item) => {
            if (item) {
                processFriendsName.push(item);
            }
        });
    }
}
function main() {
    var s = startApp();
    if (!s) {
        hamibot.exit();
        return;
    }
    parsePassCheckNames();
    sleep(1000);
    startCheckFriends();
    hamibot.exit();
}
main();

/**
 * Background Service Worker - 快捷键和数据清除支持
 */

const STORAGE_KEY = 'geoFillCachedData';
const AUTO_CLEAR_KEY = 'geoFillAutoClear';

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'geofill-open',
    title: 'GeoFill - 打开面板',
    contexts: ['page', 'editable']
  });
});

// 右键菜单点击处理 - 尝试打开 popup
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'geofill-open') {
    chrome.action.openPopup();
  }
});

// 快捷键命令处理
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const cached = result[STORAGE_KEY];
        if (cached && cached.currentData) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'fillForm',
            data: cached.currentData
          });
        }
      } catch (error) {
        console.error('[GeoFill] 填写表单失败:', error);
      }
    }
  }
});

// 浏览器启动时检查是否需要清除数据
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.local.get(AUTO_CLEAR_KEY);
    if (result[AUTO_CLEAR_KEY]) {
      await chrome.storage.local.remove([STORAGE_KEY, 'geoFillLockedFields']);
    }
  } catch (error) {
    console.error('[GeoFill] 清除数据失败:', error);
  }
});
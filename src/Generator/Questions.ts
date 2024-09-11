export default class Questions {
    public static KEY_GENERATE_MODULE = 'generate_module'
    public static KEY_REFRESH_SPRYKER_INFO = 'refresh_info'
    public static KEY_SWITCH_ACTIVE_PROJECT = 'switch_active_shop'
    public static KEY_ADD_NEW_PROJECT = 'add_new_shop'
    public static KEY_PUBLISH_REPO = 'publish_repo'
    public static KEY_INTEGRATE_MODULE = 'integrate_module'
    public static KEY_RUN_CS_FIX = 'cs_fix'
    public static KEY_EXIT = 'exit'
    public static KEY_CONFIRM_YES = 'yes'
    public static KEY_CONFIRM_NO = 'no'

    public static getTargetModeList = () => {
        return [
            {
                name: '➕ Add new project configuration',
                value: Questions.KEY_ADD_NEW_PROJECT
            },
            {
                name: '🔀 Switch active project',
                value: Questions.KEY_SWITCH_ACTIVE_PROJECT
            },
            {
                name: '⚙️ Generate module',
                value: Questions.KEY_GENERATE_MODULE
            },
            {
                name: '🛠️ Integrate module for active project',
                value: Questions.KEY_INTEGRATE_MODULE
            },
            {
                name: '🧹 Fix module coding style',
                value: Questions.KEY_RUN_CS_FIX
            },
            {
                name: '🔄 Refresh Spryker info for active project',
                value: Questions.KEY_REFRESH_SPRYKER_INFO
            },
            // {
            //     name: '🚀 Publish Repository',
            //     value: Questions.KEY_PUBLISH_REPO
            // },
            {
                name: '😢 Exit',
                value: Questions.KEY_EXIT
            },
        ]
    }

    public static getYesNoList = () => {
        return [
            {
                name: 'Yes',
                value: Questions.KEY_CONFIRM_YES
            },
            {
                name: 'No',
                value: Questions.KEY_CONFIRM_NO
            }
        ]
    }
}
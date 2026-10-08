package cloud.hubera.docs

import android.app.Application
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.TokenStore

class DocsApp : Application() {
    lateinit var tokens: TokenStore
        private set
    lateinit var api: DocsApi
        private set

    override fun onCreate() {
        super.onCreate()
        tokens = TokenStore(this)
        api = DocsApi(BuildConfig.API_BASE_URL, tokens)
    }
}

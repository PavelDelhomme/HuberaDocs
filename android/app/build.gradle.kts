plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

fun readAppVersion(): String {
    val f = rootProject.projectDir.parentFile.resolve("VERSION")
    if (!f.isFile) return "0.2.0"
    return f.readText().trim().ifBlank { "0.2.0" }
}

fun versionCodeFromSemver(semver: String): Int {
    val parts = semver.split(".").mapNotNull { it.toIntOrNull() }
    val maj = parts.getOrElse(0) { 0 }
    val min = parts.getOrElse(1) { 0 }
    val pat = parts.getOrElse(2) { 0 }
    return maj * 10_000 + min * 100 + pat
}

fun escBuildConfig(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")

val appSemver = readAppVersion()
val appVersionCode = versionCodeFromSemver(appSemver)

android {
    namespace = "cloud.hubera.docs"
    compileSdk = 35

    defaultConfig {
        applicationId = if (project.hasProperty("legacyAppId")) {
            "ovh.delhomme.hubera.docs"
        } else {
            "cloud.hubera.docs"
        }
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = "p+$appSemver"
        buildConfigField("String", "API_BASE_URL", "\"https://docs.hubera.cloud\"")
        buildConfigField("String", "APP_VERSION", "\"${escBuildConfig(appSemver)}\"")
        buildConfigField("String", "APP_CHANNEL", "\"p\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.4")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation(project(":hubera-id-sso"))
    implementation(project(":hubera-chrome"))
}

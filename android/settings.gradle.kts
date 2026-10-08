pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "HuberaDocs"
include(":app")
include(":hubera-id-sso")
project(":hubera-id-sso").projectDir = file("hubera-id-sso")
include(":hubera-chrome")
project(":hubera-chrome").projectDir = file("hubera-chrome")

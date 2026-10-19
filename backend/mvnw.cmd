@echo off
setlocal

pushd "%~dp0"
set "MAVEN_PROJECTBASEDIR=%CD%"

if defined JAVA_HOME (
  set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
) else (
  set "JAVA_EXE=java.exe"
)

"%JAVA_EXE%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -classpath ".mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*

set "WRAPPER_EXIT_CODE=%ERRORLEVEL%"
popd
endlocal & exit /b %WRAPPER_EXIT_CODE%


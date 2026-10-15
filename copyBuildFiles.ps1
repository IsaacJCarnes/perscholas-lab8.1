
$curPath = $PSScriptRoot
$buildPath = $curPath + "\dist\"


function CopyFile{
    param (
        $fileName
    )
    try{
        Copy-Item -Path "${buildPath}${fileName}" -Destination "${curPath}/${fileName}"
        "Copied from ${buildPath}${fileName} to ${curPath}/${fileName}"
    } catch {
        "Could not copy from ${buildPath}${fileName} to ${curPath}/${fileName}"
    }
}

function FindRemoveCopyFile{
    param (
        $fileName
    )
    try{
        $curFile = gci -Path ${curPath} -Filter ${fileName} -File
        Remove-Item -Path ${curFile}
        "Removed ${curFile}"
    } catch{
        "Could not remove ${curPath}${fileName}"
    }
    try{
        $targetFile = gci -Path ${buildPath} -Filter ${fileName} -File
        CopyFile(${targetFile})
    } catch{
        "There was an error"
    }
}

CopyFile("index.html")
CopyFile("index.js")
CopyFile("index.css")
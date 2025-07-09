import './style.css'
import { createIcons } from 'lucide'

// Initialize Lucide icons
createIcons()

// Download functionality
async function handleDownload(platform) {
    try {
        // Get latest release from GitHub API
        const response = await fetch('https://api.github.com/repos/Edward-cloud-del/framesense/releases/latest')
        if (!response.ok) {
            throw new Error('Failed to fetch release info')
        }
        
        const release = await response.json()
        const assets = release.assets
        
        // Find the right asset for the platform
        let downloadUrl = null
        
        if (platform === 'mac') {
            // Look for .dmg file - prefer x64 (Intel) for better compatibility
            const macAsset = assets.find(asset => 
                asset.name.includes('.dmg') && (
                    asset.name.includes('x64') || 
                    asset.name.includes('x86_64') ||
                    asset.name.includes('aarch64')
                )
            )
            downloadUrl = macAsset?.browser_download_url
        } else if (platform === 'windows') {
            // Look for .msi file first (preferred), then .exe
            const winAsset = assets.find(asset => 
                asset.name.includes('.msi') || 
                asset.name.includes('-setup.exe')
            )
            downloadUrl = winAsset?.browser_download_url
        } else if (platform === 'linux') {
            // Look for .AppImage file
            const linuxAsset = assets.find(asset => 
                asset.name.includes('.AppImage')
            )
            downloadUrl = linuxAsset?.browser_download_url
        }
        
        if (downloadUrl) {
            // Direct download
            window.open(downloadUrl, '_blank')
        } else {
            // Fallback to releases page or build instructions
            if (release.assets && release.assets.length > 0) {
                window.open('https://github.com/Edward-cloud-del/framesense/releases/latest', '_blank')
            } else {
                // No releases yet - show build instructions
                alert('FrameSense is still building! Check back in a few minutes or visit: https://github.com/Edward-cloud-del/framesense/releases')
                window.open('https://github.com/Edward-cloud-del/framesense/releases', '_blank')
            }
        }
    } catch (error) {
        console.error('Download error:', error)
        // Fallback to releases page
        window.open('https://github.com/Edward-cloud-del/framesense/releases', '_blank')
    }
}

// Get and display latest version
async function updateLatestVersion() {
    try {
        const response = await fetch('https://api.github.com/repos/Edward-cloud-del/framesense/releases/latest')
        if (response.ok) {
            const release = await response.json()
            const version = release.tag_name || 'v0.1.0'
            
            // Update version displays
            document.querySelectorAll('.latest-version').forEach(element => {
                element.textContent = version
            })
        }
    } catch (error) {
        console.log('Could not fetch latest version:', error)
        // Keep default version if API fails
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Update version info
    updateLatestVersion()
    // Download buttons
    document.getElementById('download-mac')?.addEventListener('click', () => handleDownload('mac'))
    document.getElementById('download-windows')?.addEventListener('click', () => handleDownload('windows'))
    document.getElementById('download-linux')?.addEventListener('click', () => handleDownload('linux'))
    document.getElementById('download-mac-2')?.addEventListener('click', () => handleDownload('mac'))
    document.getElementById('download-windows-2')?.addEventListener('click', () => handleDownload('windows'))
    document.getElementById('download-linux-2')?.addEventListener('click', () => handleDownload('linux'))

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault()
            const target = document.querySelector(this.getAttribute('href'))
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }
        })
    })
}) 
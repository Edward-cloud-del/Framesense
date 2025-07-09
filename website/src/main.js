import './style.css'
import { createIcons } from 'lucide'

// Initialize Lucide icons
createIcons()

// Download functionality
function handleDownload(platform) {
    // For now, redirect to GitHub releases
    // Later you can implement direct download links
    const githubReleases = 'https://github.com/Edward-cloud-del/Framesense/releases'
    window.open(githubReleases, '_blank')
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Download buttons
    document.getElementById('download-mac')?.addEventListener('click', () => handleDownload('mac'))
    document.getElementById('download-windows')?.addEventListener('click', () => handleDownload('windows'))
    document.getElementById('download-mac-2')?.addEventListener('click', () => handleDownload('mac'))
    document.getElementById('download-windows-2')?.addEventListener('click', () => handleDownload('windows'))

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
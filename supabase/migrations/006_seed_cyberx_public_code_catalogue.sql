insert into public.cyberx_public_library (library_key,payload,updated_at)
values (
 'code-library',
 jsonb_build_object(
  'name','CyberX Global Code & Device Reference Library',
  'version','7',
  'generated','2026-11-22',
  'entryCount',8,
  'categories',jsonb_build_array('Web','Web & APIs','Python','Databases','Electronics & IoT','Device Security & IoT','Operating Systems'),
  'entries',jsonb_build_array(
   jsonb_build_object('id','cloud-js-hello','category','Web','language','JavaScript','title','Hello world','level','Beginner','desc','Print a first message in the browser console.','code','console.log("Hello from CyberX");','source','https://developer.mozilla.org/en-US/docs/Web/JavaScript','tags',jsonb_build_array('javascript','web')),
   jsonb_build_object('id','cloud-js-fetch','category','Web & APIs','language','JavaScript','title','Fetch JSON from an API','level','Beginner','desc','Fetch a public demo record with error handling.','code','async function loadRecord() {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  if (!response.ok) throw new Error("HTTP " + response.status);
  console.log(await response.json());
}
loadRecord().catch(console.error);','source','https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API','tags',jsonb_build_array('javascript','api','fetch')),
   jsonb_build_object('id','cloud-py-hello','category','Python','language','Python','title','Hello world','level','Beginner','desc','Print a first message in a Python console.','code','print("Hello from CyberX")','source','https://docs.python.org/3/tutorial/','tags',jsonb_build_array('python')),
   jsonb_build_object('id','cloud-sql-select','category','Databases','language','SQL','title','Read a table safely','level','Beginner','desc','Read selected columns from a table.','code','SELECT id, created_at
FROM public.example_table
ORDER BY created_at DESC
LIMIT 20;','source','https://www.postgresql.org/docs/current/sql-select.html','tags',jsonb_build_array('sql','database')),
   jsonb_build_object('id','cloud-arduino-led','category','Electronics & IoT','language','Arduino C++','title','Blink an LED on your Arduino','level','Beginner','desc','Blink an LED connected to the onboard LED pin.','code','#include <Arduino.h>

void setup() { pinMode(LED_BUILTIN, OUTPUT); }
void loop() {
  digitalWrite(LED_BUILTIN, HIGH); delay(500);
  digitalWrite(LED_BUILTIN, LOW); delay(500);
}','source','https://docs.arduino.cc/','tags',jsonb_build_array('arduino','hardware','led')),
   jsonb_build_object('id','cloud-esp32-health','category','Device Security & IoT','language','Arduino C++','title','ESP32 local health telemetry','level','Beginner','desc','Print ESP32 uptime and free heap over USB serial.','code','#include <Arduino.h>
void setup() { Serial.begin(115200); }
void loop() {
  Serial.printf("Uptime %lu ms | Free heap %u bytes\\n", millis(), ESP.getFreeHeap());
  delay(2000);
}','source','https://docs.espressif.com/projects/arduino-esp32/en/latest/','tags',jsonb_build_array('esp32','telemetry')),
   jsonb_build_object('id','cloud-pwsh-firewall','category','Operating Systems','language','PowerShell','title','Review Windows firewall profiles','level','Beginner','desc','Read-only review of firewall profile settings.','code','Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction | Format-Table -AutoSize','source','https://learn.microsoft.com/en-us/powershell/module/netsecurity/get-netfirewallprofile','tags',jsonb_build_array('windows','firewall','read-only')),
   jsonb_build_object('id','cloud-bash-firewall','category','Operating Systems','language','Bash','title','Inspect Linux firewall status','level','Beginner','desc','Read firewall status without changing rules.','code','if command -v ufw >/dev/null 2>&1; then
  sudo ufw status verbose
elif command -v nft >/dev/null 2>&1; then
  sudo nft list ruleset
else
  echo ''No supported firewall command found.''
fi','source','https://documentation.ubuntu.com/server/how-to/security/firewalls/','tags',jsonb_build_array('linux','firewall','read-only'))
  )
 ),
 now()
)
on conflict (library_key) do update set payload=excluded.payload,updated_at=now();

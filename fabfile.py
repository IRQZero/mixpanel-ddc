from fabric.api import *
env.user = 'root'
env.password = ''

env.roledefs = {
    'readers': [
        'reader0',
        'reader1',
        'reader2',
        'reader4',
        'reader5',
        'reader6',
        'reader7',
        'reader9',
        #'reader10',
        'reader11',
        'reader13',
    ],
    'plinths': [
        'reader8',
        'reader12',
        'reader14',
        'reader15',
        'reader16',
    ]
}

def stop_leds():
    with settings(warn_only=True):
        run('screen -S led -p 0 -X quit')

def restart_plinth_leds():
    stop_leds()
    with cd('/root/LEDscape'):
        run('screen -S led -d -m ./opc-server -1 NOP -c 113 -s 24; sleep 1')

def restart_leds():
    stop_leds()
    with cd('/root/LEDscape/'):
        run('screen -S led -d -m ./opc-server -1 NOP -c 24 -s 24; sleep 1')

def stop_reader():
    with settings(warn_only=True):
        run('screen -S reader_server -p 0 -X quit')

def restart_reader():
    stop_reader()
    with cd('/srv/mixpanel-ddc'):
        # so ghetto but does not work without the sleep
        run('export NODE_ENV=production; screen -S reader_server -d -m nice --adjustment=-20 node index.js; sleep 1')

def full_restart_plinth():
    restart_plinth_leds()
    restart_reader()

def full_restart_reader():
    restart_leds()
    restart_reader()

def stop_master():
    with settings(warn_only=True):
        run('screen -S master -p 0 -X quit')

def restart_master():
    stop_master()
    with cd('/srv/mixpanel-ddc-master'):
        run('screen -S master -d -m npm start; sleep 1')

def update_crontab():
    # should really only have to do this once.. but if we update it,
    # the deploy is easy
    run('cp /srv/mixpanel-ddc/crontab /etc/cron.d/')

def update_code():
    with cd('/srv/mixpanel-ddc'):
        run('git fetch')
        run('git checkout --force master')
        run('git reset --hard origin/master')


from fabric.api import *
env.user = 'root'
env.password = ''

env.roledefs = {
    'plinths': [
        'reader0',
        'reader1',
        'reader2',
        'reader4',
        'reader5',
    ],
    'readers': [
        'reader14',
    ]
}

def restart_plinth_leds():
    with cd('/root/LEDscape'):
        with settings(warn_only=True):
            run('screen -S led -p 0 -X quit')
        run('screen -S led -d -m ./opc-server -1 NOP -c 113 -s 24; sleep 1')

def restart_leds():
    with cd('/root/LEDscape/'):
        with settings(warn_only=True):
            run('screen -S led -p 0 -X quit')
        run('screen -S led -d -m ./opc-server -1 NOP -c 24 -s 24; sleep 1')

def restart_reader_server():
    with cd('/srv/mixpanel-ddc'):
        # so ghetto but does not work without the sleep
        with settings(warn_only=True):
            run('screen -S reader_server -p 0 -X quit')
        run('screen -S reader_server -d -m node index.js; sleep 1')

def update_crontab():
    # should really only have to do this once.. but if we update it,
    # the deploy is easy
    run('cp /srv/mixpanel-ddc/crontab /etc/cron.d/')

def update_code():
    with cd('/srv/mixpanel-ddc'):
        run('git fetch')
        run('git checkout --force master')
        run('git reset --hard origin/master')


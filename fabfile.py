from fabric.api import *
env.user = 'root'
env.password = ''

env.roledefs = {
    'readers': [
        '10.10.200.150',
        '10.10.200.151',
        '10.10.200.152',
        '10.10.200.154',
    ]
}

def start_leds():
    with cd('/root/LEDscape/'):
        # so ghetto but does not work without the sleep
        run('screen -d -m ./opc-server -1 NOP -c 24 -s 24; sleep 1')

def start_reader_server():
    with cd('/srv/mixpanel-ddc'):
        # so ghetto but does not work without the sleep
        run('screen -d -m node index.js; sleep 1')

def update_crontab():
    # should really only have to do this once.. but if we update it,
    # the deploy is easy
    run('cp /srv/mixpanel-ddc/crontab /etc/cron.d/')

def update_code():
    with cd('/srv/mixpanel-ddc'):
        run('git fetch')
        run('git checkout --force master')
        run('git reset --hard origin/master')


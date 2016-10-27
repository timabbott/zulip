from django.db import models
from django.db.models import Manager
from six import text_type

import zerver.models

def get_deployment_by_domain(domain):
    # type: (text_type) -> Deployment
    return Deployment.objects.get(realms__domain=domain)

class RemoteZulipServer(models.Model):
    uuid = models.CharField(max_length=36, unique=True) # type: text_type
    api_key = models.CharField(max_length=32) # type: text_type

    hostname = models.CharField(max_length=128, unique=True) # type: text_type
    contact_email = models.EmailField(blank=True, null=False) # type: text_type
    last_updated = models.DateTimeField('last updated') # type: datetime.datetime

# Variant of PushDeviceToken for a remote server.
class RemotePushDeviceToken(models.Model):
    server = models.ForeignKey(RemoteZulipServer)
    # The user id on the remote server for this device device this is
    user_id = models.BigIntegerField() # type: int

    kind = models.PositiveSmallIntegerField(choices=zerver.models.PushDeviceToken.KINDS) # type: int

    token = models.CharField(max_length=4096, unique=True) # type: text_type
    last_updated = models.DateTimeField(auto_now=True) # type: datetime.datetime

    # [optional] Contains the app id of the device if it is an iOS device
    ios_app_id = models.TextField(null=True) # type: Optional[text_type]

class Deployment(models.Model):
    realms = models.ManyToManyField(zerver.models.Realm,
                                    related_name="_deployments") # type: Manager
    is_active = models.BooleanField(default=True) # type: bool

    # TODO: This should really become the public portion of a keypair, and
    # it should be settable only with an initial bearer "activation key"
    api_key = models.CharField(max_length=32, null=True) # type: text_type

    base_api_url = models.CharField(max_length=128) # type: text_type
    base_site_url = models.CharField(max_length=128) # type: text_type

    @property
    def endpoints(self):
        # type: () -> Dict[str, text_type]
        return {'base_api_url': self.base_api_url, 'base_site_url': self.base_site_url}

    @property
    def name(self):
        # type: () -> text_type

        # TODO: This only does the right thing for prod because prod authenticates to
        # staging with the zulip.com deployment key, while staging is technically the
        # deployment for the zulip.com realm.
        # This also doesn't necessarily handle other multi-realm deployments correctly.
        return self.realms.order_by('pk')[0].domain

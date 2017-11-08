import os, shutil
from tempfile import mkstemp
from rodan.jobs.base import RodanTask
from django.conf import settings

from neonsrv import tornadoapi

class conf:
    MEI_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static/MEI_DIRECTORY"))

class Neon(RodanTask):
    name = 'neon'
    author = 'Ling-Xiao Yang'
    description = 'Neon.js Square Note Editor'
    settings = {}
    enabled = True
    category = "Pitch Correction"
    interactive = True

    input_port_types = [{
        'name': 'MEI',
        'resource_types': ['application/mei+xml'],
        'minimum': 1,
        'maximum': 1
    }, {
        'name': 'Background Image',
        'resource_types': ['image/jpg'],
        'minimum': 1,
        'maximum': 1
    }]
    output_port_types = [{
        'name': 'Corrected MEI',
        'resource_types': ['application/mei+xml'],
        'minimum': 1,
        'maximum': 1
    }]

    def run_my_task(self, inputs, settings, outputs):
        if '@working_file' not in settings or not os.path.isfile(settings['@working_file']):
            f = inputs['MEI'][0]['resource_path']
            working_f = "{0}.working".format(f)
            shutil.copyfile(f, working_f)         # HACK
            return self.WAITING_FOR_INPUT({
                '@working_file': working_f
            })
        else:
            working_f = settings['@working_file']
            shutil.copyfile(working_f, outputs['Corrected MEI'][0]['resource_path'])

    def get_my_interface(self, inputs, settings):
        t = 'templates/neon_square_prod.html'
        c = {
            'MEI': inputs['MEI'][0]['resource_url'] + '.working',     # HACK
            'background_img': inputs['Background Image'][0]['resource_url']
        }
        return (t, c)


    handlers = (
        ("insert/neume", tornadoapi.InsertNeumeHandler),
        ("move/neume", tornadoapi.ChangeNeumePitchHandler),
        ("delete/neume", tornadoapi.DeleteNeumeHandler),
        ("update/neume/headshape", tornadoapi.UpdateNeumeHeadShapeHandler),
        ("neumify", tornadoapi.NeumifyNeumeHandler),
        ("ungroup", tornadoapi.UngroupNeumeHandler),
        ("insert/division", tornadoapi.InsertDivisionHandler),
        ("move/division", tornadoapi.MoveDivisionHandler),
        ("delete/division", tornadoapi.DeleteDivisionHandler),
        ("update/division/shape", tornadoapi.UpdateDivisionShapeHandler),
        ("insert/dot", tornadoapi.AddDotHandler),
        ("delete/dot", tornadoapi.DeleteDotHandler),
        ("insert/episema", tornadoapi.AddEpisemaHandler),
        ("delete/episema", tornadoapi.DeleteEpisemaHandler),
        ("insert/clef", tornadoapi.InsertClefHandler),
        ("move/clef", tornadoapi.MoveClefHandler),
        ("update/clef/shape", tornadoapi.UpdateClefShapeHandler),
        ("delete/clef", tornadoapi.DeleteClefHandler),
        ("insert/custos", tornadoapi.InsertCustosHandler),
        ("move/custos", tornadoapi.MoveCustosHandler),
        ("delete/custos", tornadoapi.DeleteCustosHandler),
        ("insert/system", tornadoapi.InsertSystemHandler),
        ("insert/systembreak", tornadoapi.InsertSystemBreakHandler),
        ("modify/systembreak", tornadoapi.ModifySystemBreakHandler),
        ("delete/systembreak", tornadoapi.DeleteSystemBreakHandler), 
        ("delete/system", tornadoapi.DeleteSystemHandler),
        ("update/system/zone", tornadoapi.UpdateSystemZoneHandler),
        ("undo", tornadoapi.FileUndoHandler),
        ("deleteundo", tornadoapi.DeleteUndosHandler),
    )
    def validate_my_user_input(self, inputs, settings, user_input):
    	request_url = getattr(self, 'url', None)
    	if request_url == 'save':
    		return {}   # let automatic phase copy the working file to output file
        for url, handlerClass in self.handlers:
            if request_url == url:
                handler = handlerClass(user_input)
                handler.post(inputs['MEI'][0]['resource_path'] + '.working')  # HACK
                return self.WAITING_FOR_INPUT(response=handler.response_content)
        raise self.ManualPhaseException("No handler found for given URL: {0}.".format(request_url))

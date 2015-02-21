import os, shutil
from tempfile import mkstemp
from rodan.jobs.base import RodanTask

import neonsrv.tornadoapi

class Neon(RodanTask):
    name = 'neon.square_note_editor_with_meix'
    author = 'Ling-Xiao Yang'
    description = 'Neon.js Square Note Editor with MEIx.js'
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
        'resource_types': lambda m: m.startswith('image/'),
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
            working_f = os.path.dirname(f) + "/image.mei"   # To let meix.js zone display link
            shutil.copyfile(f, working_f)                   # HACK
            return self.WAITING_FOR_INPUT({
                '@working_file': working_f,
                '@editor': 'neon'
            })
        else:
            working_f = settings['@working_file']
            shutil.copyfile(working_f, outputs['Corrected MEI'][0]['resource_path'])

    def get_my_interface(self, inputs, settings):
        mode = settings['@editor']
        if mode == 'meix':
            t = 'templates/meix_diva.html'
        elif mode == 'neon':
            t = 'templates/neon_square_prod.html'
        else:
            t = 'templates/neon_square_prod.html'

        c = {
            'MEI': os.path.dirname(inputs['MEI'][0]['resource_url']) + '/image.mei',     # HACK
            'background_img': inputs['Background Image'][0]['resource_url'],
            'diva_object_data': inputs['Background Image'][0]['diva_object_data'],
            'diva_iip_server': inputs['Background Image'][0]['diva_iip_server'],
            'diva_image_dir': inputs['Background Image'][0]['diva_image_dir']
        }
        return (t, c)


    handlers = (
        ("insert/neume", neonsrv.tornadoapi.InsertNeumeHandler),
        ("move/neume", neonsrv.tornadoapi.ChangeNeumePitchHandler),
        ("delete/neume", neonsrv.tornadoapi.DeleteNeumeHandler),
        ("update/neume/headshape", neonsrv.tornadoapi.UpdateNeumeHeadShapeHandler),
        ("neumify", neonsrv.tornadoapi.NeumifyNeumeHandler),
        ("ungroup", neonsrv.tornadoapi.UngroupNeumeHandler),
        ("insert/division", neonsrv.tornadoapi.InsertDivisionHandler),
        ("move/division", neonsrv.tornadoapi.MoveDivisionHandler),
        ("delete/division", neonsrv.tornadoapi.DeleteDivisionHandler),
        ("insert/dot", neonsrv.tornadoapi.AddDotHandler),
        ("delete/dot", neonsrv.tornadoapi.DeleteDotHandler),
        ("insert/clef", neonsrv.tornadoapi.InsertClefHandler),
        ("move/clef", neonsrv.tornadoapi.MoveClefHandler),
        ("update/clef/shape", neonsrv.tornadoapi.UpdateClefShapeHandler),
        ("delete/clef", neonsrv.tornadoapi.DeleteClefHandler),
        ("insert/custos", neonsrv.tornadoapi.InsertCustosHandler),
        ("move/custos", neonsrv.tornadoapi.MoveCustosHandler),
        ("delete/custos", neonsrv.tornadoapi.DeleteCustosHandler),
        ("insert/system", neonsrv.tornadoapi.InsertSystemHandler),
        ("insert/systembreak", neonsrv.tornadoapi.InsertSystemBreakHandler),
        ("modify/systembreak", neonsrv.tornadoapi.ModifySystemBreakHandler),
        ("delete/systembreak", neonsrv.tornadoapi.DeleteSystemBreakHandler),
        ("delete/system", neonsrv.tornadoapi.DeleteSystemHandler),
        ("update/system/zone", neonsrv.tornadoapi.UpdateSystemZoneHandler)
    )
    def validate_my_user_input(self, inputs, settings, user_input):
        request_url = getattr(self, 'url', None)
        if request_url == 'save':
            return {}   # let automatic phase copy the working file to output file
        elif request_url == 'use_neon':
            return self.WAITING_FOR_INPUT({"@editor": "neon"})
        elif request_url == 'use_meix':
            return self.WAITING_FOR_INPUT({"@editor": "meix"})
        for url, handlerClass in self.handlers:
            if request_url == url:
                handler = handlerClass(user_input)
                handler.post(settings['@working_file'])
                return self.WAITING_FOR_INPUT(response=handler.response_content)
        raise self.ManualPhaseException("No handler found for given URL: {0}.".format(request_url))

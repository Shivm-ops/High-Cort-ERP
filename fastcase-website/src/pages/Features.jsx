import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Scale, Phone, Building } from 'lucide-react';
import {
  appLinks, erpModuleGroups, consumerTools, consumerCategories,
} from '../data/site';

const tabs = [
  { id: 'erp', label: 'Advocate ERP', icon: Briefcase, sub: 'For advocates & law firms' },
  { id: 'consumer', label: 'Consumer Portal', icon: Scale, sub: 'For citizens & consumers' },
];

function ErpFeatures() {
  return (
    <div className="space-y-14">
      {erpModuleGroups.map((g) => (
        <div key={g.id}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
            <div>
              <h2 className="font-heading font-[800] text-2xl text-slate-900">{g.title}</h2>
              <p className="mt-1 text-[14.5px] text-slate-600">{g.summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {g.modules.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#059669]/40 hover:shadow-card-hover transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center mb-3.5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-[700] text-[15.5px] text-slate-900">{name}</h3>
                <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link to="/advocate-erp" className="btn-primary text-sm">Advocate ERP overview <ArrowRight className="w-4 h-4" /></Link>
        <a href={appLinks.advocateLogin()} className="btn-secondary text-sm">Advocate Login</a>
      </div>
    </div>
  );
}

function ConsumerFeatures() {
  return (
    <div className="space-y-14">
      <div>
        <h2 className="font-heading font-[800] text-2xl text-slate-900">Tools inside the portal</h2>
        <p className="mt-1 text-[14.5px] text-slate-600">Four sections, available after you open the Consumer Portal.</p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {consumerTools.map(({ icon: Icon, name, tag, desc }) => (
            <div key={name} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">{tag}</span>
              </div>
              <h3 className="font-heading font-[700] text-[16px] text-slate-900">{name}</h3>
              <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-[800] text-2xl text-slate-900">Problems covered</h2>
        <p className="mt-1 text-[14.5px] text-slate-600">For each problem the portal gives free guidance and can prepare a formal application addressed to the right authority.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {consumerCategories.map(({ id, icon: Icon, title, desc, authority, helpline }) => (
            <div key={id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <h3 className="font-heading font-[700] text-[14.5px] text-slate-900 leading-snug">{title}</h3>
                  <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[12.5px] text-slate-600">
                <p className="flex items-start gap-2"><Building className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" /> Addressed to: <span className="font-medium text-slate-800">{authority}</span></p>
                {helpline && (
                  <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> Helpline: <span className="font-semibold text-slate-800">{helpline}</span></p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link to="/consumer-portal" className="btn-primary text-sm">Consumer Portal overview <ArrowRight className="w-4 h-4" /></Link>
        <a href={appLinks.consumerPortal()} className="btn-secondary text-sm">Open the portal</a>
      </div>
    </div>
  );
}

export default function Features() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.hash === '#consumer' ? 'consumer' : 'erp';
  const [active, setActive] = useState(initial);

  useEffect(() => {
    setActive(location.hash === '#consumer' ? 'consumer' : 'erp');
  }, [location.hash]);

  const select = (id) => {
    setActive(id);
    navigate({ hash: id }, { replace: true });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-[70vh]">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="section-container pt-14 pb-10 sm:pt-16 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">Features</p>
          <h1 className="mt-3 font-heading font-[900] text-[32px] sm:text-[44px] leading-tight tracking-tight text-slate-900">
            Everything you can do on Fastcase
          </h1>
          <p className="mt-4 text-[16px] text-slate-600 max-w-2xl mx-auto">
            Choose a product to see its features.
          </p>

          {/* Product switch */}
          <div role="tablist" aria-label="Products" className="mt-8 inline-grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200 w-full max-w-lg">
            {tabs.map(({ id, label, icon: Icon, sub }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => select(id)}
                  className={`flex items-center justify-center gap-2.5 px-3 py-3 rounded-xl text-left transition-all ${isActive ? 'bg-white shadow-sm border border-slate-200' : 'border border-transparent hover:bg-white/60'
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#059669]' : 'text-slate-400'}`} />
                  <span>
                    <span className={`block text-[14px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
                    <span className="hidden sm:block text-[11.5px] text-slate-500">{sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="section-container" role="tabpanel">
          {active === 'erp' ? <ErpFeatures /> : <ConsumerFeatures />}
        </div>
      </section>
    </div>
  );
}

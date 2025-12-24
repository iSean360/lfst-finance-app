import React, { useState } from 'react';
import {
  FileCode2,
  Database,
  Layers,
  Zap,
  Box,
  GitBranch,
  Shield,
  Rocket,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import appSchema from '../constants/appSchema';

const AppArchitecture = () => {
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    techStack: false,
    coreEngines: false,
    dataModels: false,
    components: false,
    services: false,
    dataFlow: false,
    features: false,
    roadmap: false,
    security: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const ExpandableSection = ({ title, icon: Icon, section, children, badge }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {badge && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {badge}
            </span>
          )}
        </div>
        {expandedSections[section] ? (
          <ChevronDown className="text-gray-400" size={20} />
        ) : (
          <ChevronRight className="text-gray-400" size={20} />
        )}
      </button>
      {expandedSections[section] && (
        <div className="p-4 pt-0 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  const DataFlowDiagram = () => (
    <div className="space-y-3">
      {appSchema.dataFlow.steps.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
            {step.step}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{step.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {step.components.map((comp, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {comp}
                </span>
              ))}
            </div>
          </div>
          {idx < appSchema.dataFlow.steps.length - 1 && (
            <ArrowRight className="text-gray-300 mt-2" size={20} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileCode2 className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">App Architecture & Functionality</h1>
        </div>
        <p className="text-gray-600">
          Comprehensive technical documentation automatically generated from the application codebase
        </p>
      </div>

      {/* Metadata */}
      <ExpandableSection title="Application Overview" icon={Info} section="metadata">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Basic Info</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {appSchema.metadata.name}</div>
              <div><span className="font-medium">Full Name:</span> {appSchema.metadata.fullName}</div>
              <div><span className="font-medium">Version:</span> {appSchema.metadata.version}</div>
              <div><span className="font-medium">Fiscal Year:</span> {appSchema.metadata.fiscalYearCycle}</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={16} />
                <span className="font-medium">Current Phase:</span> {appSchema.metadata.currentPhase}
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="text-blue-600" size={16} />
                <span className="font-medium">Deployment:</span> {appSchema.metadata.deploymentStatus}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Purpose:</span> {appSchema.metadata.purpose}
          </p>
        </div>
      </ExpandableSection>

      {/* Tech Stack */}
      <ExpandableSection title="Technology Stack" icon={Layers} section="techStack">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Box size={16} className="text-blue-600" />
              Frontend
            </h3>
            <div className="space-y-2">
              {appSchema.techStack.frontend.map((tech, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="font-medium text-sm">{tech.name}</div>
                  <div className="text-xs text-gray-600">v{tech.version}</div>
                  <div className="text-xs text-gray-500">{tech.purpose}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Database size={16} className="text-green-600" />
              Backend
            </h3>
            <div className="space-y-2">
              {appSchema.techStack.backend.map((tech, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="font-medium text-sm">{tech.name}</div>
                  <div className="text-xs text-gray-600">v{tech.version}</div>
                  <div className="text-xs text-gray-500">{tech.purpose}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-yellow-600" />
              Utilities
            </h3>
            <div className="space-y-2">
              {appSchema.techStack.utilities.map((tech, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="font-medium text-sm">{tech.name}</div>
                  <div className="text-xs text-gray-600">v{tech.version}</div>
                  <div className="text-xs text-gray-500">{tech.purpose}</div>
                </div>
              ))}
              {appSchema.techStack.devTools.map((tool, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div className="text-xs text-gray-500">{tool.purpose}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Core Engines */}
      <ExpandableSection
        title="Core Engines"
        icon={Zap}
        section="coreEngines"
        badge={`${appSchema.coreEngines.length} engines`}
      >
        <div className="space-y-4">
          {appSchema.coreEngines.map((engine, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">{engine.name}</h3>

              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">FILES:</div>
                <div className="flex flex-wrap gap-1">
                  {engine.files.map((file, i) => (
                    <span key={i} className="px-2 py-1 bg-white text-gray-700 text-xs rounded font-mono">
                      {file}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="font-semibold text-green-700 mb-1">INPUT</div>
                  <div className="text-gray-700">{engine.dataFlow.input}</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-700 mb-1">PROCESS</div>
                  <div className="text-gray-700">{engine.dataFlow.process}</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-700 mb-1">OUTPUT</div>
                  <div className="text-gray-700">{engine.dataFlow.output}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">KEY FUNCTIONS:</div>
                <div className="flex flex-wrap gap-1">
                  {engine.keyFunctions.map((func, i) => (
                    <code key={i} className="px-2 py-1 bg-white text-blue-700 text-xs rounded">
                      {func}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Data Models */}
      <ExpandableSection title="Data Models & Schemas" icon={Database} section="dataModels">
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Firestore Structure</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm">
            <div className="text-blue-600 mb-2">{appSchema.dataModels.firestoreStructure.path}</div>
            {appSchema.dataModels.firestoreStructure.collections.map((col, idx) => (
              <div key={idx} className="ml-4 mb-1">
                <span className="text-green-600">├── {col.name}</span>
                <span className="text-gray-500 ml-2">({col.type})</span>
                <span className="text-gray-600 ml-2 text-xs">// {col.purpose}</span>
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-semibold text-gray-700 mb-3">Data Schemas</h3>
        <div className="space-y-3">
          {appSchema.dataModels.schemas.map((schema, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 font-semibold text-sm">
                {schema.name}
              </div>
              <div className="p-3 bg-white">
                <div className="grid md:grid-cols-2 gap-2 text-sm font-mono">
                  {Object.entries(schema.fields).map(([key, value], i) => (
                    <div key={i} className="flex">
                      <span className="text-blue-600 font-semibold">{key}:</span>
                      <span className="text-gray-600 ml-2">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Components */}
      <ExpandableSection
        title="React Components"
        icon={Box}
        section="components"
        badge={`${appSchema.components.length} components`}
      >
        <div className="space-y-3">
          {['Core', 'Analytics', 'Financial', 'Membership', 'Operations', 'Planning', 'Utilities'].map(category => {
            const categoryComponents = appSchema.components.filter(c => c.category === category);
            if (categoryComponents.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
                <div className="space-y-2">
                  {categoryComponents.map((comp, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-gray-900">{comp.name}</span>
                          <code className="ml-2 text-xs text-gray-500">{comp.path}</code>
                        </div>
                        {comp.userFacing && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            User-Facing
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{comp.purpose}</p>
                      {comp.features && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-gray-600 mb-1">Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {comp.features.map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ExpandableSection>

      {/* Services */}
      <ExpandableSection title="Services & Utilities" icon={GitBranch} section="services">
        <div className="space-y-4">
          {appSchema.services.map((service, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
              <code className="text-xs text-gray-500">{service.path}</code>
              <p className="text-sm text-gray-600 mt-2 mb-3">{service.purpose}</p>

              <div className="text-xs font-semibold text-gray-600 mb-2">Functions ({service.functions.length}):</div>
              <div className="grid md:grid-cols-2 gap-2">
                {service.functions.map((func, i) => (
                  <div key={i} className="text-sm">
                    <code className="text-blue-600 font-semibold">{func.name}</code>
                    <span className="text-gray-600 ml-2">- {func.purpose}</span>
                  </div>
                ))}
              </div>

              {service.integrations && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Integrations:</span>
                  {service.integrations.map((int, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {int}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Data Flow */}
      <ExpandableSection title="Data Flow Architecture" icon={GitBranch} section="dataFlow">
        <div className="mb-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
            <p className="text-sm text-gray-700">{appSchema.dataFlow.overview}</p>
          </div>

          <DataFlowDiagram />

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">State Management</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Pattern:</span> {appSchema.dataFlow.stateManagement.pattern}</div>
              <div><span className="font-medium">Global State:</span> {appSchema.dataFlow.stateManagement.noGlobalState}</div>
              <div><span className="font-medium">Source of Truth:</span> {appSchema.dataFlow.stateManagement.sourceOfTruth}</div>
              <div><span className="font-medium">Data Loading:</span> {appSchema.dataFlow.stateManagement.dataLoading}</div>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Features */}
      <ExpandableSection
        title="User-Facing Features"
        icon={CheckCircle2}
        section="features"
        badge={`${appSchema.features.length} features`}
      >
        <div className="grid md:grid-cols-2 gap-4">
          {appSchema.features.map((feature, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded shrink-0">
                  {feature.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{feature.description}</p>

              <div className="text-xs font-semibold text-gray-600 mb-1">Components:</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {feature.components.map((comp, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {comp}
                  </span>
                ))}
              </div>

              <div className="text-xs font-semibold text-gray-600 mb-1">Capabilities:</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {feature.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Roadmap */}
      <ExpandableSection title="Development Roadmap" icon={Rocket} section="roadmap">
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-900">
                {appSchema.roadmap.completed.phase}: {appSchema.roadmap.completed.name}
              </h3>
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                {appSchema.roadmap.completed.status}
              </span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1 ml-7">
              {appSchema.roadmap.completed.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {appSchema.roadmap.upcoming.map((phase, idx) => (
            <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-900">
                  {phase.phase}: {phase.name}
                </h3>
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                  {phase.status}
                </span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 ml-7">
                {phase.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Security */}
      <ExpandableSection title="Security Considerations" icon={Shield} section="security">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="text-yellow-600" size={18} />
              Current State
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Authentication:</span>
                <span className="ml-2 text-yellow-700">{appSchema.security.current.authentication}</span>
              </div>
              <div>
                <span className="font-medium">Firestore Rules:</span>
                <span className="ml-2 text-yellow-700">{appSchema.security.current.firestoreRules}</span>
              </div>
              <div>
                <span className="font-medium">Data Validation:</span>
                <span className="ml-2 text-yellow-700">{appSchema.security.current.dataValidation}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="text-green-600" size={18} />
              Planned Security
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Authentication:</span>
                <span className="ml-2 text-green-700">{appSchema.security.planned.authentication}</span>
              </div>
              <div>
                <span className="font-medium">Roles:</span>
                <div className="ml-2 flex flex-wrap gap-1 mt-1">
                  {appSchema.security.planned.roles.map((role, i) => (
                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Firestore Rules:</span>
                <span className="ml-2 text-green-700">{appSchema.security.planned.firestoreRules}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Security TODOs</h3>
          <ul className="space-y-2">
            {appSchema.security.todos.map((todo, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">{todo}</span>
              </li>
            ))}
          </ul>
        </div>
      </ExpandableSection>

      {/* Footer */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 text-center">
        <p className="text-sm text-gray-600">
          This architecture documentation is automatically generated from{' '}
          <code className="px-2 py-1 bg-white text-blue-700 rounded text-xs">
            src/constants/appSchema.js
          </code>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default AppArchitecture;

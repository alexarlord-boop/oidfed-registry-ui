<!-- This is a draft requirements outline -->
# OIDFed Registry 

## OIDFed Registry Frontend requirements

### Web interface with user access control

**Official technical contacts (users)** of member organizations can register an account and, therefore, are authorised to apply for the registration of entities in the federation.

Federated authentication can be an option if organizations maintain their technical contacts in a single database and provide a federated login mechanism. However, if a member organization does not operate an IdP/OP within the federation, its technical contacts cannot authenticate using this method.

Therefore, we cannot rely on this approach in all cases. Consequently, either the official technical contact registers and is approved by the **FedOPs (admin)**, or the FedOPs create local accounts for them.

To simplify adoption and avoid pushing authentication complexity into early deployments, we can introduce an **Auth Gateway** component between the Web UI and the Admin API.

The Auth Gateway would:

- **Issue its own JWTs**  
  * Signed with its private key  
  * Used by the UI to authenticate subsequent requests  
- **Maintain the user store**  
  * Accounts for technical contacts  
  * Local password/passkey authentication  
  * Optional provisioning workflow for FedOP operators: CRUD+ accounts  
- **Handle federated login via existing AAI**  
  * Initiates OIDC redirects  
  * Processes the callback and exchanges authorization codes  
  * Maps AAI user identities to local registry users (email match or explicit linking)

This keeps the Admin API independent of specific authentication mechanisms and allows the registry to support both local and federated authentication modes. The Admin API only receives authenticated requests from the gateway and does not need to implement identity management or OIDC logic.   
Frontend → FastAPI Auth Gateway (local \+ OIDC login) → Admin API (registry logic)

### TA registration

The system should allow admins and users to **register and manage multiple Trust Anchors (TAs)**.

At a minimum, one **Registry** instance must be able to register:

* **One Federation Trust Anchor (TA)**, and

* **One Intermediate Authority (IA)** — for example, entities used for eduGAIN Interfederation.

Additionally, the admin should have the ability to manage other types of federations or aggregators, such as:

* A Test Federation (used for testing new entities or configurations),  
* A Training Federation (used for training and demonstration purposes), or  
* Another IA if needed for specific use cases.

### 

#### Approval Workflow \- park for later

Every registration action must include an **approval step**. When a new endpoint or entity is submitted, it automatically enters the **“Pending”** state.

An admin then reviews the request and can:

* Approve – the endpoint or entity becomes active and operational, or  
* Reject – the request is declined and remains inactive.  
* Delete request.

### Subordinate Registration

SAML registry model that can serve as a reference: 

* The entity is initially configured with basic technical parameters.  
* During the registration process, all information available in the metadata is automatically retrieved and displayed as **default (placeholder)** values of respective fields, which can be reviewed and modified through the GUI.  
* Additional information, such as **contacts, logo, and descriptions,** can be added through the registry interface if not present in metadata.  
* It is possible to configure additional metadata elements such as **Entity Attributes**, **Link to MRPS (Metadata Registration Practice Statement)**, and Other optional or custom fields. These fields can be **activated** in the configuration so that they appear in the registration form and can be **included in the metadata** of each entity.

* The metadata is then generated from the combined data.

A similar approach should be adopted for OIDFed.

In OIDFed, information about an entity can be obtained in two ways at the same time:

* **Dynamically** – fetched from the endpoint  
* **Staticly** – entered manually by the user or admin.

1. During registration \- enrolment, users provide only the entity\_id and signing keys (fetch periodically) and ??? obtained from the Entity Configuration or Self-signed Entity Statement available at the endpoint:

 .well-known/openid-federation

2. Additional fields \+ configurable fields:

The system should support the configuration of additional fields or parameters that can be added during the registration process.

Additional information, such as **display name, contacts, logo, description, policy uri, etc.** can be added through the registry interface if not present in the Entity Statement.

*At the link [https://testbed.oidf.lab.surf.nl/](https://testbed.oidf.lab.surf.nl/)  , an example of an Entity Statement of one leaf can be found, e.g. [https://leafs.oidf.lab.surf.nl/leafs/79489178e2a22b940c435d0d7128d868cd62ae76/entity.json](https://leafs.oidf.lab.surf.nl/leafs/79489178e2a22b940c435d0d7128d868cd62ae76/entity.json)*

*https://leafs.oidf.lab.surf.nl/leafs/fa90b206df51ffb8b1bbbc64a4cd0d2aec2fc204/entity.json*

- Moreover, the relevant fields are specified under **Entity Type UI Info**, available at:  
  [*https://zachmann.github.io/openid-federation-entity-collection/main.html\#entity-type-ui-info*](https://zachmann.github.io/openid-federation-entity-collection/main.html#entity-type-ui-info)     
  *and [https://openid.net/specs/openid-federation-1\_0.html\#name-informational-metadata-exte](https://openid.net/specs/openid-federation-1_0.html#name-informational-metadata-exte)* 

**\! Action Point:** Define the fields that shall be registered with TA (what should be kept and what values are not refreshed periodically):

- #### **TM Issuer** registration

In OIDFed, some of the additional elements should be represented as **Trust Marks (TMs)**.

This approach and the mapping of metadata fields to Trust Marks should be further discussed.

The T**rust Mark Owner** can delegate Trust Mark **issuance** to one or more **Trust Mark Issuers**.

Key points:

* The Trust Mark Issuer must be a participant in the federation.  
* The Trust Mark Owner may or may not be part of the federation.  
* The Trust Mark Owner issues a Delegation JWT to the Trust Mark Issuer.  
* The Trust Mark Issuer includes this Delegation JWT within the Trust Mark JWT.  
* **The Trust Anchor (TA) publishes information about Trust Mark Owners in its Entity Configuration**, including the JWKS of each Trust Mark Owner (used to verify Delegation JWTs).

- #### **TM assignment** 

Open question:

Should the Trust Mark assignment occur during the registration process, or should it be handled as a separate post-registration action?

- categorisation  
- test/prod/acceptance  
- ticketing \- space for tracking history of discussions / text box maybe be enough   
- promoting to another federation  
- update the Authority hints

3\.       Approval Workflow

There is always an **approval step** in the registration workflow.  
 When a new entity or endpoint is proposed, it should initially move to the **“Pending”** state.

An admin then reviews the request and can either:

* Approve \- after validation, the entity becomes active and part of the federation, or  
* Reject \- the request is declined and the entity remains inactive.  
* Delete request.

### Reporting Dashboard

Admins shall have access to stats on one dashboard, including:

* Number of OPs per TA  
* Number of RPs per TA  
* ?

##  OIDFed Registry Backend requirements

API: [https://gitlab.software.geant.org/TI\_Incubator/federation-admin-api/-/blob/gabriel/federation\_admin\_openapi.yaml?ref\_type=heads](https://gitlab.software.geant.org/TI_Incubator/federation-admin-api/-/blob/gabriel/federation_admin_openapi.yaml?ref_type=heads) 